import { Injectable, signal, WritableSignal } from '@angular/core';
import { EscPosBuilder } from '../utils/esc-pos-builder';
import { Pedido } from '../interfaces/pedido.model';

// Declara la interfaz de Web Bluetooth para TypeScript si no está en lib.dom.d.ts
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options?: any): Promise<any>;
      getDevices?(): Promise<any[]>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class BluetoothPrintService {
  isConnected: WritableSignal<boolean> = signal(false);
  deviceName: WritableSignal<string> = signal('');
  isPrinting: WritableSignal<boolean> = signal(false);
  errorMessage: WritableSignal<string | null> = signal(null);

  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private printCharacteristic: any = null;

  // UUIDs conocidos de impresoras térmicas Bluetooth (ESC/POS)
  private readonly THERMAL_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard Thermal Printer Service
    '49535343-fe7d-4358-9146-4637070e2de5', // ISSC Transparent Serial Service
    '0000af02-0000-1000-8000-00805f9b34fb', // Generic POS Printer Service
    '0000e781-0000-1000-8000-00805f9b34fb', // Alternate Serial Service
    '00001101-0000-1000-8000-00805f9b34fb'  // SPP UUID
  ];

  constructor() {
    this.checkSavedDeviceState();
    this.restorePairedDevice();
  }

  /**
   * Intenta recuperar la impresora previamente autorizada (Chrome con getDevices habilitado)
   * para no tener que volver a abrir el selector en cada sesión.
   */
  private async restorePairedDevice(): Promise<void> {
    try {
      if (!this.isBluetoothSupported() || !navigator.bluetooth!.getDevices) return;
      const savedName = this.deviceName();
      if (!savedName) return;
      const devices = await navigator.bluetooth!.getDevices();
      const found = devices.find(d => d.name === savedName);
      if (found) {
        this.bluetoothDevice = found;
        this.isConnected.set(true);
      }
    } catch {
      // getDevices no disponible: el usuario deberá seleccionar la impresora una vez por sesión
    }
  }

  isBluetoothSupported(): boolean {
    return typeof window !== 'undefined' && !!navigator.bluetooth;
  }

  private checkSavedDeviceState(): void {
    if (typeof localStorage !== 'undefined') {
      const savedName = localStorage.getItem('paskana_bt_printer_name');
      if (savedName) {
        this.deviceName.set(savedName);
      }
    }
  }

  /**
   * Abre el selector nativo del navegador para buscar y conectar la impresora Bluetooth
   */
  async connect(): Promise<boolean> {
    this.errorMessage.set(null);

    if (!this.isBluetoothSupported()) {
      this.errorMessage.set('La API de Web Bluetooth no es compatible con este navegador. Utiliza Google Chrome o Microsoft Edge.');
      return false;
    }

    try {
      console.log('Buscando dispositivos Bluetooth...');

      // Solicitar dispositivo con servicios comunes de impresoras térmicas
      this.bluetoothDevice = await navigator.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: this.THERMAL_SERVICES
      });

      if (!this.bluetoothDevice) {
        throw new Error('No se seleccionó ningún dispositivo.');
      }

      // Verificar que la impresora es compatible y liberar la conexión inmediatamente
      await this.openConnection();
      this.releaseConnection();

      this.isConnected.set(true);
      const name = this.bluetoothDevice.name || 'Impresora Bluetooth';
      this.deviceName.set(name);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('paskana_bt_printer_name', name);
      }

      console.log('Impresora Bluetooth conectada con éxito.');
      return true;

    } catch (err: any) {
      console.error('Error al conectar impresora Bluetooth:', err);
      this.releaseConnection();
      this.bluetoothDevice = null;
      this.isConnected.set(false);
      if (err.name !== 'NotFoundError') { // NotFoundError ocurre cuando el usuario cancela la ventana nativa
        this.errorMessage.set(err.message || 'Error al conectar con la impresora Bluetooth.');
      }
      return false;
    }
  }

  /**
   * Cierra la conexión GATT de la impresora
   */
  disconnect(): void {
    this.releaseConnection();
    this.bluetoothDevice = null;
    this.isConnected.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('paskana_bt_printer_name');
    }
    this.deviceName.set('');
  }

  /**
   * Abre la conexión GATT (con reintentos por si otro dispositivo la está usando)
   */
  private async openConnection(): Promise<void> {
    if (!this.bluetoothDevice) {
      throw new Error('No hay impresora seleccionada.');
    }

    const MAX_RETRIES = 5;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.gattServer = await this.bluetoothDevice.gatt.connect();
        this.printCharacteristic = await this.findPrintCharacteristic(this.gattServer);
        if (!this.printCharacteristic) {
          throw new Error('No se encontró una característica de escritura en la impresora.');
        }
        return;
      } catch (err) {
        lastError = err;
        this.releaseConnection();
        // La impresora puede estar ocupada por otro dispositivo: esperar y reintentar
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
      }
    }

    throw new Error('La impresora está ocupada o fuera de alcance. Intenta nuevamente en unos segundos.' +
      (lastError?.message ? ` (${lastError.message})` : ''));
  }

  /**
   * Libera la conexión para que otros dispositivos puedan usar la impresora
   */
  private releaseConnection(): void {
    try {
      if (this.bluetoothDevice?.gatt?.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
    } catch {
      // ignorar
    }
    this.gattServer = null;
    this.printCharacteristic = null;
  }

  /**
   * Busca recursivamente en los servicios GATT una característica que permita escribir datos
   */
  private async findPrintCharacteristic(gattServer: any): Promise<any> {
    // 1. Probar servicios conocidos primero
    for (const serviceUuid of this.THERMAL_SERVICES) {
      try {
        const service = await gattServer.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      } catch {
        // Ignorar si el servicio no está presente en este dispositivo
      }
    }

    // 2. Fallback: Recorrer todos los servicios primarios expuestos por el dispositivo
    try {
      const services = await gattServer.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      }
    } catch (e) {
      console.warn('Error escaneando servicios GATT primarios:', e);
    }

    return null;
  }

  /**
   * Envía un búfer binario en paquetes (chunks) a la impresora
   */
  async sendRawBuffer(buffer: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.bluetoothDevice) {
      throw new Error('La impresora Bluetooth no está configurada.');
    }

    this.isPrinting.set(true);
    this.errorMessage.set(null);

    try {
      await this.openConnection();

      const CHUNK_SIZE = 128; // Paquetes de 128 bytes para evitar saturar el búfer de la impresora
      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.slice(i, i + CHUNK_SIZE);

        if (this.printCharacteristic.properties.writeWithoutResponse) {
          await this.printCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.printCharacteristic.writeValue(chunk);
        }

        // Pequeño retardo entre paquetes para estabilidad de comunicación
        await new Promise(resolve => setTimeout(resolve, 35));
      }
    } catch (err: any) {
      console.error('Error durante la impresión Bluetooth:', err);
      this.errorMessage.set(err?.message || 'Error al enviar los datos a la impresora Bluetooth.');
      throw err;
    } finally {
      // Pequeña espera para que la impresora termine de procesar antes de soltar el canal
      await new Promise(resolve => setTimeout(resolve, 300));
      this.releaseConnection();
      this.isPrinting.set(false);
    }
  }

  /**
   * Imprime un ticket de prueba
   */
  async printTestTicket(): Promise<void> {
    const builder = new EscPosBuilder(32);

    builder
      .align('center')
      .bold(true)
      .doubleSize(true)
      .textLine('PASKANA')
      .doubleSize(false)
      .bold(false)
      .textLine('Impresión de Prueba Bluetooth')
      .separator()
      .align('left')
      .textLine(`Fecha: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')} hs`)
      .textLine(`Impresora: ${this.deviceName()}`)
      .separator()
      .textLine('Verificación de caracteres:')
      .textLine('ñ Ñ á é í ó ú ° ¿ ¡')
      .separator()
      .align('center')
      .bold(true)
      .textLine('¡IMPRESORA OPERATIVA!')
      .bold(false)
      .cut();

    await this.sendRawBuffer(builder.generate());
  }

  /**
   * Genera el ticket comanda en formato ESC/POS (58mm) y lo envía a la impresora Bluetooth
   */
  async printPedido(pedido: Pedido): Promise<void> {
    const builder = new EscPosBuilder(32);

    // Formatear Fecha y Hora
    let horaStr = '00:00 hs';
    const fechaObj = (pedido as any).fecha || pedido.fechaCreacion;
    if (fechaObj) {
      const dateObj = typeof fechaObj.toDate === 'function' ? fechaObj.toDate() : new Date(fechaObj);
      if (!isNaN(dateObj.getTime())) {
        horaStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
      }
    }

    // Cabecera del Ticket
    builder
      .align('center')
      .bold(true)
      .doubleSize(true)
      .textLine('PASKANA')
      .doubleSize(false)
      .bold(false)
      .textLine('Control de Comandas')
      .separator('=');

    // Datos del Pedido
    builder.align('left');

    const numPedido = pedido.codigoOrden || pedido.numeroPedido;
    if (numPedido) {
      builder.bold(true).textLine(`PEDIDO #: #${numPedido}`).bold(false);
    }

    builder.textLine(`Hora: ${horaStr}`);
    if (pedido.usuarioNombre) {
      builder.textLine(`Atendido por: ${pedido.usuarioNombre}`);
    }

    let ubicacionStr = pedido.paraLlevar ? 'Servicio: Para Llevar' : `Servicio: Mesa ${pedido.mesa || 1}`;
    if (pedido.observaciones) {
      ubicacionStr += ` - ${pedido.observaciones}`;
    }
    builder.bold(true).textLine(ubicacionStr).bold(false);
    builder.separator('-');

    // Encabezado de Productos
    builder.row('CANT DESCRIPCION', 'IMPORTE');
    builder.separator('-');

    // Lista de ítems
    if (pedido.items && pedido.items.length) {
      pedido.items.forEach(item => {
        const cantidad = item.cantidad || 1;
        const nombreItem = item.nombre || (item as any).producto?.nombre || 'Producto';
        const subtotalNum = item.subtotal || ((item.precioUnitario || 0) * cantidad);
        const subtotalStr = `$${subtotalNum.toLocaleString('es-AR')}`;

        const leftCol = `${cantidad}x ${nombreItem}`;
        builder.row(leftCol, subtotalStr);

        // Si el producto tiene comentario personalizado
        if (item.comentario && item.comentario.trim()) {
          builder.textLine(`   (${item.comentario.trim()})`);
        }
      });
    }

    builder.separator('-');

    // Total y Método de Pago
    const totalNum = pedido.total || (pedido as any).montoTotal || 0;
    builder
      .align('right')
      .bold(true)
      .textLine(`TOTAL: $${totalNum.toLocaleString('es-AR')}`)
      .bold(false)
      .align('left');

    if (pedido.metodoPago) {
      builder.textLine(`Pago: ${pedido.metodoPago}`);
    }

    builder
      .separator('=')
      .align('center')
      .bold(true)
      .textLine('NO VALIDO COMO FACTURA')
      .bold(false)
      .textLine('¡Gracias por su compra!')
      .cut();

    await this.sendRawBuffer(builder.generate());
  }
}

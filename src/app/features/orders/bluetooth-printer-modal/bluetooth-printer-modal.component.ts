import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BluetoothPrintService } from '../../../core/services/bluetooth-print.service';

@Component({
  selector: 'app-bluetooth-printer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bluetooth-printer-modal.component.html',
  styleUrl: './bluetooth-printer-modal.component.css'
})
export class BluetoothPrinterModalComponent {
  btService = inject(BluetoothPrintService);

  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  onClose(): void {
    this.closeModal.emit();
  }

  async connectPrinter(): Promise<void> {
    await this.btService.connect();
  }

  disconnectPrinter(): void {
    this.btService.disconnect();
  }

  async printTestTicket(): Promise<void> {
    try {
      await this.btService.printTestTicket();
    } catch (e) {
      // Manejado en btService.errorMessage
    }
  }
}

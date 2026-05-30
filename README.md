# Sistema Gestor de Inventario y Caja

Sistema Gestor de inventario y caja, para una cafeteria.

## Tabla de Contenidos
- [Instalación](#instalación)
- [Comandos](#comandos)
- [Uso](#uso)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

## Instalación

Instrucciones para instalar:
```bash
# Instalar los modulos de node
npm install
```

```bash
# Crear el proyecto
ng new paskana --routing --style=css
```

# Configuración de la Conexión a Firebase:

Ejecutamos el siguiente comando para agregar firebase al proyecto

```bash
npm install firebase @angular/fire@19.2.0

```
Y luego agregamos el environment

```bash
ng g environments

```

Instalación de Dependencias:
 
```bash
# Descargar Tailwind
npm install tailwindcss @tailwindcss/postcss postcss --force

# Descargar Sweet Alert 2
npm install sweetalert2 


```
**Nota:**  Crear un archivo en la raiz ".postcssrc.json" y pega el siguiente código
```
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}

```

## Comandos

Estructura del Proyecto y Comando

```bash
# Servicios
ng g s core/services/firestore --skip-tests
ng g s core/services/auth --skip-tests
ng g s core/services/school --skip-tests
ng g s features/tasks/task --skip-tests
ng g s core/services/visita --skip-tests
ng g s core/services/activityFeed  --skip-tests
ng g s core/services/cloudinary  --skip-tests
ng g s core/services/eleccion  --skip-tests
```

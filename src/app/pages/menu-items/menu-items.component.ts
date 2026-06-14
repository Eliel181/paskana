import { Component } from '@angular/core';

@Component({
  selector: 'app-menu-items',
  imports: [],
  templateUrl: './menu-items.component.html',
  styleUrl: './menu-items.component.css'
})
export class MenuItemsComponent {
  categories = ['Cafés', 'Postres', 'Jugos', 'Licuados', 'Minutas', 'Extras', 'Bebidas'];
  selectedCategory = 'Cafés';

  menuItems = [
    // Cafés
    { name: 'Especial Latte', description: 'Delicioso espresso con leche espumosa y un toque de vainilla.', price: '$5.000', image: '/featured_coffee.png', tag: 'Especial', category: 'Cafés' },
    { name: 'Cappuccino Clásico', description: 'Espresso intenso con partes iguales de leche vaporizada y abundante espuma.', price: '$4.500', image: '/featured_coffee.png', tag: 'Popular', category: 'Cafés' },
    { name: 'Espresso Intenso', description: 'Un shot concentrado de café puro, con una crema rica y dorada.', price: '$3.500', image: '/featured_coffee.png', tag: 'Clásico', category: 'Cafés' },
    { name: 'Café Americano', description: 'Espresso suave diluido con agua caliente, ideal para comenzar la mañana.', price: '$3.800', image: '/featured_coffee.png', category: 'Cafés' },
    { name: 'Mocaccino Dulce', description: 'Combinación perfecta de espresso, chocolate premium, leche vaporizada y crema batida.', price: '$5.200', image: '/featured_coffee.png', tag: 'Recomendado', category: 'Cafés' },
    { name: 'Caramel Macchiato', description: 'Leche vaporizada con vainilla manchada con espresso y finalizada con caramelo.', price: '$5.500', image: '/featured_coffee.png', tag: 'Dulce', category: 'Cafés' },
    { name: 'Flat White', description: 'Doble shot de espresso corto con una fina capa de leche aterciopelada.', price: '$4.800', image: '/featured_coffee.png', category: 'Cafés' },
    { name: 'Irish Coffee', description: 'Café caliente combinado con whisky irlandés, azúcar morena y cubierto de crema espesa.', price: '$6.500', image: '/featured_coffee.png', category: 'Cafés' },

    // Postres
    { name: 'Tarta de Chocolate', description: 'Exquisita tarta de tres chocolates con base crujiente.', price: '$4.200', image: '/featured_coffee.png', tag: 'Delicioso', category: 'Postres' },
    { name: 'Cheesecake de Frutos Rojos', description: 'Clásica tarta de queso horneada, cubierta con una reducción de frutos rojos silvestres.', price: '$4.500', image: '/featured_coffee.png', category: 'Postres' },
    { name: 'Medialunas con Dulce de Leche', description: 'Dos medialunas de manteca calentitas rellenas de dulce de leche artesanal.', price: '$2.500', image: '/featured_coffee.png', category: 'Postres' },

    // Jugos
    { name: 'Jugo de Naranja Exprimido', description: '100% naranja natural y fresca exprimida al instante.', price: '$3.000', image: '/featured_coffee.png', tag: 'Fresco', category: 'Jugos' },
    { name: 'Jugo de Pomelo Rosado', description: 'Jugo natural de pomelo rosado con un toque de menta.', price: '$3.200', image: '/featured_coffee.png', category: 'Jugos' },

    // Licuados
    { name: 'Licuado de Banana con Leche', description: 'Clásico licuado cremoso de banana madura y leche entera.', price: '$3.500', image: '/featured_coffee.png', category: 'Licuados' },
    { name: 'Licuado Frutal de Estación', description: 'Mix de frutas de temporada con agua o leche a elección.', price: '$3.800', image: '/featured_coffee.png', tag: 'Popular', category: 'Licuados' },

    // Minutas
    { name: 'Tostado de Jamón y Queso', description: 'Tostado clásico en pan de campo con abundante jamón cocido y queso derretido.', price: '$4.900', image: '/featured_coffee.png', tag: 'Caliente', category: 'Minutas' },
    { name: 'Avocado Toast', description: 'Tostada de pan de masa madre con palta pisada, huevo poché y semillas de sésamo.', price: '$5.500', image: '/featured_coffee.png', category: 'Minutas' },

    // Extras
    { name: 'Adicional de Dulce de Leche', description: 'Una porción extra de dulce de leche artesanal.', price: '$800', image: '/featured_coffee.png', category: 'Extras' },
    { name: 'Shot de Espresso Extra', description: 'Añade intensidad a tu bebida con un shot adicional de café.', price: '$1.000', image: '/featured_coffee.png', category: 'Extras' },

    // Bebidas
    { name: 'Agua Mineral', description: 'Agua mineral con o sin gas de 500ml.', price: '$2.000', image: '/featured_coffee.png', category: 'Bebidas' },
    { name: 'Gaseosa Línea Pepsi', description: 'Bebida cola o lima limón en lata fría de 354ml.', price: '$2.200', image: '/featured_coffee.png', category: 'Bebidas' }
  ];

  get filteredItems() {
    return this.menuItems.filter(item => item.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }
}


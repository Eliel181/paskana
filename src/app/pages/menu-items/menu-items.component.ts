import { Component } from '@angular/core';

@Component({
  selector: 'app-menu-items',
  imports: [],
  templateUrl: './menu-items.component.html',
  styleUrl: './menu-items.component.css'
})
export class MenuItemsComponent {
  coffees = [
    {
      name: 'Especial Latte',
      description: 'Delicioso espresso con leche espumosa y un toque de vainilla.',
      price: '$5.000',
      image: '/featured_coffee.png',
      tag: 'Especial'
    },
    {
      name: 'Cappuccino Clásico',
      description: 'Espresso intenso con partes iguales de leche vaporizada y abundante espuma.',
      price: '$4.500',
      image: '/featured_coffee.png',
      tag: 'Popular'
    },
    {
      name: 'Espresso Intenso',
      description: 'Un shot concentrado de café puro, con una crema rica y dorada.',
      price: '$3.500',
      image: '/featured_coffee.png',
      tag: 'Clásico'
    },
    {
      name: 'Café Americano',
      description: 'Espresso suave diluido con agua caliente, ideal para comenzar la mañana.',
      price: '$3.800',
      image: '/featured_coffee.png'
    },
    {
      name: 'Mocaccino Dulce',
      description: 'Combinación perfecta de espresso, chocolate premium, leche vaporizada y crema batida.',
      price: '$5.200',
      image: '/featured_coffee.png',
      tag: 'Recomendado'
    },
    {
      name: 'Caramel Macchiato',
      description: 'Leche vaporizada con vainilla manchada con espresso y finalizada con caramelo.',
      price: '$5.500',
      image: '/featured_coffee.png',
      tag: 'Dulce'
    },
    {
      name: 'Flat White',
      description: 'Doble shot de espresso corto con una fina capa de leche aterciopelada.',
      price: '$4.800',
      image: '/featured_coffee.png'
    },
    {
      name: 'Irish Coffee',
      description: 'Café caliente combinado con whisky irlandés, azúcar morena y cubierto de crema espesa.',
      price: '$6.500',
      image: '/featured_coffee.png'
    }
  ];
}


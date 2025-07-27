// src/hooks/usePDFGenerator.js
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND_CONFIG, getRGBColor } from '../config/branding';

export const usePDFGenerator = () => {

  // Función para añadir el header con branding
  const addBrandedHeader = useCallback((doc, title) => {
    // Fondo decorativo para el header
    doc.setFillColor(248, 250, 252); // Gris muy claro
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F');
    
    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...getRGBColor('recipes'));
    doc.text(title, 20, 30);
    
    // Subtítulo decorativo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('RecipesAPI - Sistema de Gestión de Eventos', 20, 38);
  }, []);

  // Función para añadir el footer con branding simplificado
  const addBrandedFooter = useCallback((doc) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Footer sin línea decorativa
    
    // Logo RecipesAPI (centro) - usando configuración centralizada
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    
    // Calcular posición para centrar el texto completo
    const logoWidth = doc.getTextWidth(BRAND_CONFIG.name);
    const centerX = pageWidth / 2;
    const startX = centerX - (logoWidth / 2);
    
    // "Recipes" usando color configurado
    const recipesRGB = getRGBColor('recipes');
    doc.setTextColor(recipesRGB[0], recipesRGB[1], recipesRGB[2]);
    doc.text(BRAND_CONFIG.logoText.part1, startX, pageHeight - 6);
    
    // "API" usando color configurado
    const recipesWidth = doc.getTextWidth(BRAND_CONFIG.logoText.part1);
    const apiRGB = getRGBColor('api');
    doc.setTextColor(apiRGB[0], apiRGB[1], apiRGB[2]);
    doc.text(BRAND_CONFIG.logoText.part2, startX + recipesWidth, pageHeight - 6);
  }, []);

  // Generar PDF de evento
  const generateEventPDF = useCallback((event, eventRecipes = []) => {
    if (!event) return;

    const doc = new jsPDF();
    
    // Header
    addBrandedHeader(doc, 'DETALLE DEL EVENTO');
    
    // Información básica del evento
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    let yPosition = 60; // Ajustar para el nuevo header más alto
    
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Evento:', 20, yPosition);
    yPosition += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Nombre del evento
    doc.text(`Evento: ${event.name}`, 20, yPosition);
    yPosition += 8;
    
    // Fecha y hora
    const eventDate = new Date(event.event_date).toLocaleDateString('es-ES');
    const eventTime = event.event_time ? event.event_time.substring(0, 5) : '';
    const dateTimeText = eventTime ? `${eventDate} a las ${eventTime}` : eventDate;
    doc.text(`Fecha: ${dateTimeText}`, 20, yPosition);
    yPosition += 8;
    
    // Número de invitados (corregir el campo)
    const guestsCount = event.guests_count || event.guests || 1;
    doc.text(`Invitados: ${guestsCount} ${guestsCount === 1 ? 'persona' : 'personas'}`, 20, yPosition);
    yPosition += 8;
    
    // Presupuesto (si existe)
    if (event.budget && parseFloat(event.budget) > 0) {
      doc.text(`Presupuesto: ${new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(event.budget)}`, 20, yPosition);
      yPosition += 8;
    }
    
    // Ubicación (si existe)
    if (event.location) {
      doc.text(`Ubicación: ${event.location}`, 20, yPosition);
      yPosition += 8;
    }
    
    // Descripción (si existe)
    if (event.description) {
      doc.text(`Descripción: ${event.description}`, 20, yPosition);
      yPosition += 15;
    } else {
      yPosition += 10;
    }
    
    // Menú del evento
    if (eventRecipes && eventRecipes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Menú del Evento:', 20, yPosition);
      yPosition += 15;
      
      const tableData = eventRecipes.map(recipe => {
        // Formatear información nutricional (por 100g)
        const nutritionInfo = recipe.calories || recipe.protein || recipe.carbs || recipe.fat ? 
          `${recipe.calories || 0} kcal | P: ${recipe.protein || 0}g | C: ${recipe.carbs || 0}g | G: ${recipe.fat || 0}g` :
          'No disponible';
        
        // Formatear alérgenos
        const allergensInfo = recipe.allergens ? recipe.allergens : 'Ninguno';
        
        return [
          recipe.recipe_name || recipe.name,
          recipe.portions?.toString() || '1',
          nutritionInfo,
          allergensInfo,
          recipe.notes || '-'
        ];
      });
      
      autoTable(doc, {
        head: [['Receta', 'Porciones', 'Nutrición (por 100g)', 'Alérgenos', 'Notas']],
        body: tableData,
        startY: yPosition,
        columnStyles: {
          0: { cellWidth: 45 }, // Receta
          1: { cellWidth: 20, halign: 'center' }, // Porciones  
          2: { cellWidth: 45 }, // Nutrición
          3: { cellWidth: 35 }, // Alérgenos
          4: { cellWidth: 'auto' } // Notas (resto del espacio)
        },
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [100, 116, 139], // Gris oscuro en lugar de azul
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 20;
    }
    
    // Footer con branding
    addBrandedFooter(doc);
    
    // Descargar el PDF
    const eventName = event.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const eventDateForFilename = new Date(event.event_date).toISOString().split('T')[0];
    doc.save(`Evento_${eventName}_${eventDateForFilename}.pdf`);
  }, [addBrandedHeader, addBrandedFooter]);

  // Generar PDF de pedido con branding unificado
  const generateOrderPDF = useCallback((order) => {
    if (!order) return;

    const doc = new jsPDF();
    
    // Header con el mismo estilo que eventos
    addBrandedHeader(doc, 'PEDIDO DE COMPRA');
    
    // Información en dos columnas
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    let yPosition = 60;
    
    // Función helper para obtener etiqueta de estado
    const getStatusLabel = (status) => {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'ordered': return 'Enviado';
        case 'delivered': return 'Entregado';
        case 'cancelled': return 'Cancelado';
        default: return status;
      }
    };
    
    // COLUMNA IZQUIERDA - Información del Pedido
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Pedido:', 20, yPosition);
    
    let leftColumnY = yPosition + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    doc.text(`Pedido: #${order.order_id}`, 20, leftColumnY);
    leftColumnY += 8;
    doc.text(`Estado: ${getStatusLabel(order.status)}`, 20, leftColumnY);
    leftColumnY += 8;
    doc.text(`Fecha de pedido: ${new Date(order.order_date).toLocaleDateString('es-ES')}`, 20, leftColumnY);
    leftColumnY += 8;
    
    if (order.delivery_date) {
      doc.text(`Fecha de entrega: ${new Date(order.delivery_date).toLocaleDateString('es-ES')}`, 20, leftColumnY);
      leftColumnY += 8;
    }
    
    doc.text(`Creado por: ${order.first_name} ${order.last_name}`, 20, leftColumnY);
    leftColumnY += 8;
    
    doc.text(`Total del pedido: ${new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(order.total_amount)}`, 20, leftColumnY);
    leftColumnY += 8;
    
    // COLUMNA DERECHA - Información del Proveedor
    doc.setFont('helvetica', 'bold');
    doc.text('Proveedor:', 110, yPosition);
    
    let rightColumnY = yPosition + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    doc.text(`${order.supplier_name}`, 110, rightColumnY);
    rightColumnY += 8;
    
    if (order.supplier_phone) {
      doc.text(`Teléfono: ${order.supplier_phone}`, 110, rightColumnY);
      rightColumnY += 8;
    }
    
    if (order.supplier_email) {
      doc.text(`Email: ${order.supplier_email}`, 110, rightColumnY);
      rightColumnY += 8;
    }
    
    // Ajustar yPosition al final de ambas columnas
    yPosition = Math.max(leftColumnY, rightColumnY) + 15;
    
    // Notas (si existen)
    if (order.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(order.notes, 170);
      doc.text(splitNotes, 20, yPosition);
      yPosition += splitNotes.length * 5 + 15;
    }
    
    // Tabla de ingredientes
    if (order.items && order.items.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Items del Pedido:', 20, yPosition);
      yPosition += 15;
      
      const tableData = order.items.map(item => [
        item.ingredient_name,
        `${item.quantity} ${item.unit}`,
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.unit_price),
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.total_price),
        `${item.current_stock} ${item.unit}`
      ]);
      
      autoTable(doc, {
        head: [['Ingrediente', 'Cantidad', 'Precio Unit.', 'Total', 'Stock Actual']],
        body: tableData,
        foot: [['', '', 'TOTAL PEDIDO:', new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(order.total_amount), '']],
        startY: yPosition,
        columnStyles: {
          0: { cellWidth: 'auto' }, // Ingrediente (auto width)
          1: { cellWidth: 30, halign: 'center' }, // Cantidad
          2: { cellWidth: 30, halign: 'right' }, // Precio Unit.
          3: { cellWidth: 30, halign: 'right' }, // Total
          4: { cellWidth: 30, halign: 'center' } // Stock Actual
        },
        tableWidth: 'auto',
        margin: { left: 20, right: 20 },
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [100, 116, 139], // Mismo gris que eventos
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        footStyles: {
          fillColor: [236, 240, 241],
          textColor: [40, 40, 40],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 20;
    }
    
    // Footer con branding unificado
    addBrandedFooter(doc);
    
    // Descargar el PDF
    const supplierName = order.supplier_name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    doc.save(`Pedido_${order.order_id}_${supplierName}.pdf`);
  }, [addBrandedHeader, addBrandedFooter]);

  return {
    generateEventPDF,
    generateOrderPDF,
    addBrandedHeader,
    addBrandedFooter
  };
};
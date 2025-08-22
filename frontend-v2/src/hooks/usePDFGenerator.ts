// src/hooks/usePDFGenerator.ts
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BRAND_CONFIG, getRGBColor } from '@/config/branding'
import { useAuth } from '@/context/AuthContext'

interface Event {
  event_id: number
  name: string
  description?: string
  event_date: string
  event_time?: string
  guests_count: number
  location?: string
  status: string
  budget?: number
  notes?: string
}

interface EventRecipe {
  recipe_id: number
  recipe_name: string
  portions: number
  course_type: string
  notes?: string
  cost_per_serving?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  allergens?: string
}

interface Order {
  order_id: number
  order_date: string
  delivery_date?: string
  status: string
  total_amount: number
  supplier_name: string
  supplier_phone?: string
  supplier_email?: string
  notes?: string
  first_name?: string
  last_name?: string
  items?: OrderItem[]
}

interface OrderItem {
  ingredient_name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  current_stock: number
}

export const usePDFGenerator = () => {
  const { user } = useAuth()
  // Función para añadir el header con branding
  const addBrandedHeader = useCallback((doc: jsPDF, title: string, restaurantName?: string) => {
    // Fondo decorativo para el header (más compacto)
    doc.setFillColor(248, 250, 252) // Gris muy claro
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 35, 'F')
    
    // Nombre del restaurante (arriba)
    if (restaurantName) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(60, 60, 60) // Gris oscuro
      doc.text(restaurantName.toUpperCase(), 20, 15)
    }
    
    // Título principal (más abajo y más pequeño)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...getRGBColor('recipes'))
    doc.text(title, 20, restaurantName ? 28 : 20)
    
    // Fecha/hora en la esquina derecha del header
    const currentDate = new Date().toLocaleDateString('es-ES')
    const currentTime = new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.text(`Generado: ${currentDate} ${currentTime}`, pageWidth - 70, restaurantName ? 15 : 20)
  }, [])

  // Función para añadir el footer con branding (sin icono)
  const addBrandedFooter = useCallback((doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Configurar fuente para el footer (más pequeña)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    
    // Calcular posiciones para centrar el texto
    const textWidth = doc.getTextWidth(BRAND_CONFIG.name)
    const centerX = pageWidth / 2
    const startX = centerX - (textWidth / 2)
    
    // "Recetas" en naranja
    const recipesRGB = getRGBColor('recipes')
    doc.setTextColor(recipesRGB[0], recipesRGB[1], recipesRGB[2])
    doc.text(BRAND_CONFIG.logoText.part1, startX, pageHeight - 8)
    
    // "API" en negro/gris
    const recipesWidth = doc.getTextWidth(BRAND_CONFIG.logoText.part1)
    const apiRGB = getRGBColor('api')
    doc.setTextColor(apiRGB[0], apiRGB[1], apiRGB[2])
    doc.text(BRAND_CONFIG.logoText.part2, startX + recipesWidth, pageHeight - 8)
  }, [])

  // Generar PDF de evento
  const generateEventPDF = useCallback((event: Event, eventRecipes: EventRecipe[] = []) => {
    if (!event) return

    const doc = new jsPDF()
    
    // Header con nombre del restaurante real
    const restaurantName = user?.restaurant_name || 'RESTAURANTE'
    addBrandedHeader(doc, 'DETALLE DEL EVENTO', restaurantName)
    
    // Información básica del evento en formato más compacto (2 columnas)
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    let yPosition = 45 // Ajustar para el nuevo header más compacto
    
    // Sección de información básica
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('INFORMACIÓN DEL EVENTO', 20, yPosition)
    yPosition += 10
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Columna izquierda
    let leftColumnY = yPosition
    
    // Nombre del evento
    doc.setFont('helvetica', 'bold')
    doc.text('Evento:', 20, leftColumnY)
    doc.setFont('helvetica', 'normal')
    doc.text(event.name, 45, leftColumnY)
    leftColumnY += 6
    
    // Fecha y hora
    const eventDate = new Date(event.event_date).toLocaleDateString('es-ES')
    const eventTime = event.event_time ? event.event_time.substring(0, 5) : ''
    const dateTimeText = eventTime ? `${eventDate} a las ${eventTime}` : eventDate
    doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', 20, leftColumnY)
    doc.setFont('helvetica', 'normal')
    doc.text(dateTimeText, 45, leftColumnY)
    leftColumnY += 6
    
    // Número de invitados
    const guestsCount = event.guests_count || 1
    doc.setFont('helvetica', 'bold')
    doc.text('Invitados:', 20, leftColumnY)
    doc.setFont('helvetica', 'normal')
    doc.text(`${guestsCount} ${guestsCount === 1 ? 'persona' : 'personas'}`, 45, leftColumnY)
    leftColumnY += 6
    
    // Columna derecha
    let rightColumnY = yPosition
    
    // Estado
    doc.setFont('helvetica', 'bold')
    doc.text('Estado:', 110, rightColumnY)
    doc.setFont('helvetica', 'normal')
    const statusLabels: Record<string, string> = {
      planned: 'Planificado',
      confirmed: 'Confirmado',
      in_progress: 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado'
    }
    doc.text(statusLabels[event.status] || event.status, 130, rightColumnY)
    rightColumnY += 6
    
    // Presupuesto (si existe)
    if (event.budget && parseFloat(event.budget.toString()) > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Presupuesto:', 110, rightColumnY)
      doc.setFont('helvetica', 'normal')
      doc.text(`${new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(event.budget)}`, 135, rightColumnY)
      rightColumnY += 6
    }
    
    // Ubicación (si existe)
    if (event.location) {
      doc.setFont('helvetica', 'bold')
      doc.text('Ubicación:', 110, rightColumnY)
      doc.setFont('helvetica', 'normal')
      // Dividir ubicación si es muy larga
      const locationText = doc.splitTextToSize(event.location, 60)
      doc.text(locationText, 140, rightColumnY)
      rightColumnY += locationText.length * 6
    }
    
    // Ajustar yPosition al final de ambas columnas
    yPosition = Math.max(leftColumnY, rightColumnY) + 8
    
    // Descripción (si existe) - ancho completo
    if (event.description) {
      doc.setFont('helvetica', 'bold')
      doc.text('Descripción:', 20, yPosition)
      yPosition += 6
      
      doc.setFont('helvetica', 'normal')
      const splitDescription = doc.splitTextToSize(event.description, 170)
      doc.text(splitDescription, 20, yPosition)
      yPosition += splitDescription.length * 6 + 8
    }

    // Notas (si existen) - ancho completo
    if (event.notes) {
      doc.setFont('helvetica', 'bold')
      doc.text('Notas:', 20, yPosition)
      yPosition += 6
      
      doc.setFont('helvetica', 'normal')
      const splitNotes = doc.splitTextToSize(event.notes, 170)
      doc.text(splitNotes, 20, yPosition)
      yPosition += splitNotes.length * 6 + 8
    }
    
    // Menú del evento
    if (eventRecipes && eventRecipes.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('MENÚ DEL EVENTO', 20, yPosition)
      yPosition += 8
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPosition, 190, yPosition)
      yPosition += 10
      
      const courseTypeLabels: Record<string, string> = {
        starter: 'Entrante',
        main: 'Principal',
        side: 'Acompañamiento',
        dessert: 'Postre',
        beverage: 'Bebida'
      }
      
      const tableData = eventRecipes.map(recipe => {
        // Formatear información nutricional (por 100g)
        const nutritionInfo = recipe.calories || recipe.protein || recipe.carbs || recipe.fat ? 
          `${recipe.calories || 0} kcal | P: ${recipe.protein || 0}g | C: ${recipe.carbs || 0}g | G: ${recipe.fat || 0}g` :
          'No disponible'
        
        // Formatear alérgenos
        const allergensInfo = recipe.allergens ? recipe.allergens : 'Ninguno'
        
        return [
          recipe.recipe_name,
          courseTypeLabels[recipe.course_type] || recipe.course_type,
          recipe.portions?.toString() || '1',
          nutritionInfo,
          allergensInfo,
          recipe.notes || '-'
        ]
      })
      
      autoTable(doc, {
        head: [['Receta', 'Tipo', 'Porciones', 'Nutrición (por 100g)', 'Alérgenos', 'Notas']],
        body: tableData,
        startY: yPosition,
        columnStyles: {
          0: { cellWidth: 35 }, // Receta
          1: { cellWidth: 25 }, // Tipo
          2: { cellWidth: 20, halign: 'center' }, // Porciones  
          3: { cellWidth: 40 }, // Nutrición
          4: { cellWidth: 30 }, // Alérgenos
          5: { cellWidth: 'auto' } // Notas (resto del espacio)
        },
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [100, 116, 139], // Gris oscuro
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 20
    }
    
    // Footer con branding
    addBrandedFooter(doc)
    
    // Descargar el PDF
    const eventName = event.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    const eventDateForFilename = new Date(event.event_date).toISOString().split('T')[0]
    doc.save(`Evento_${eventName}_${eventDateForFilename}.pdf`)
  }, [addBrandedHeader, addBrandedFooter, user])

  // Generar PDF de pedido
  const generateOrderPDF = useCallback((order: Order) => {
    if (!order) return

    const doc = new jsPDF()
    
    // Header con nombre del restaurante
    const restaurantName = user?.restaurant_name || 'RESTAURANTE'
    addBrandedHeader(doc, 'PEDIDO DE COMPRA', restaurantName)
    
    // Información en dos columnas (más compacto)
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    let yPosition = 45
    
    // Función helper para obtener etiqueta de estado
    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'pending': return 'Pendiente'
        case 'ordered': return 'Confirmado'
        case 'delivered': return 'Recibido'
        case 'cancelled': return 'Cancelado'
        default: return status
      }
    }
    
    // Sección de información básica
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('INFORMACIÓN DEL PEDIDO', 20, yPosition)
    yPosition += 10
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // COLUMNA IZQUIERDA - Información del Pedido
    let leftColumnY = yPosition
    
    doc.setFont('helvetica', 'bold')
    doc.text('Pedido:', 20, leftColumnY)
    doc.setFont('helvetica', 'normal')
    doc.text(`#${order.order_id}`, 45, leftColumnY)
    leftColumnY += 6
    
    doc.setFont('helvetica', 'bold')
    doc.text('Estado:', 20, leftColumnY)
    doc.setFont('helvetica', 'normal')
    doc.text(getStatusLabel(order.status), 45, leftColumnY)
    leftColumnY += 6
    
    doc.setFont('helvetica', 'bold')
    doc.text('Fecha pedido:', 20, leftColumnY)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(order.order_date).toLocaleDateString('es-ES'), 55, leftColumnY)
    leftColumnY += 6
    
    if (order.delivery_date) {
      doc.setFont('helvetica', 'bold')
      doc.text('Fecha entrega:', 20, leftColumnY)
      doc.setFont('helvetica', 'normal')
      doc.text(new Date(order.delivery_date).toLocaleDateString('es-ES'), 55, leftColumnY)
      leftColumnY += 6
    }
    
    if (order.first_name && order.last_name) {
      doc.setFont('helvetica', 'bold')
      doc.text('Creado por:', 20, leftColumnY)
      doc.setFont('helvetica', 'normal')
      doc.text(`${order.first_name} ${order.last_name}`, 50, leftColumnY)
      leftColumnY += 6
    }
    
    // COLUMNA DERECHA - Información del Proveedor
    let rightColumnY = yPosition
    
    doc.setFont('helvetica', 'bold')
    doc.text('Proveedor:', 110, rightColumnY)
    doc.setFont('helvetica', 'normal')
    const supplierText = doc.splitTextToSize(order.supplier_name, 60)
    doc.text(supplierText, 110, rightColumnY + 6)
    rightColumnY += supplierText.length * 6 + 6
    
    if (order.supplier_phone) {
      doc.setFont('helvetica', 'bold')
      doc.text('Teléfono:', 110, rightColumnY)
      doc.setFont('helvetica', 'normal')
      doc.text(order.supplier_phone, 130, rightColumnY)
      rightColumnY += 6
    }
    
    if (order.supplier_email) {
      doc.setFont('helvetica', 'bold')
      doc.text('Email:', 110, rightColumnY)
      doc.setFont('helvetica', 'normal')
      const emailText = doc.splitTextToSize(order.supplier_email, 60)
      doc.text(emailText, 125, rightColumnY)
      rightColumnY += emailText.length * 6
    }
    
    // Total del pedido destacado
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', 110, rightColumnY + 6)
    doc.setFontSize(12)
    doc.text(`${new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(order.total_amount)}`, 130, rightColumnY + 6)
    
    // Ajustar yPosition al final de ambas columnas
    yPosition = Math.max(leftColumnY, rightColumnY + 12) + 8
    
    // Notas (si existen)
    if (order.notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Notas:', 20, yPosition)
      yPosition += 6
      
      doc.setFont('helvetica', 'normal')
      const splitNotes = doc.splitTextToSize(order.notes, 170)
      doc.text(splitNotes, 20, yPosition)
      yPosition += splitNotes.length * 6 + 8
    }
    
    // Tabla de ingredientes
    if (order.items && order.items.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('ITEMS DEL PEDIDO', 20, yPosition)
      yPosition += 8
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPosition, 190, yPosition)
      yPosition += 10
      
      const tableData = order.items.map(item => [
        item.ingredient_name,
        `${item.quantity} ${item.unit}`,
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.unit_price),
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.total_price),
        `${item.current_stock} ${item.unit}`
      ])
      
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
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 20
    }
    
    // Footer con branding
    addBrandedFooter(doc)
    
    // Descargar el PDF
    const supplierName = order.supplier_name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    doc.save(`Pedido_${order.order_id}_${supplierName}.pdf`)
  }, [addBrandedHeader, addBrandedFooter, user])

  return {
    generateEventPDF,
    generateOrderPDF,
    addBrandedHeader,
    addBrandedFooter
  }
}
# principal/utils.py
import os
from io import BytesIO
from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from datetime import datetime
from django.utils import timezone
from django.utils.timezone import localtime

def generar_boleta_pdf(orden):
    """Genera un PDF con la boleta de la compra"""
    buffer = BytesIO()
    
    # Crear el documento
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        textColor=colors.HexColor('#FFD700')
    )
    
    # Título
    elements.append(Paragraph("CRONOS ELEGANCE - BOLETA ELECTRÓNICA", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Información de la empresa
    company_info = [
        "Cronos Elegance",
        "RUT: 76.123.456-7",
        "Av. Principal 123, Santiago",
        "Tel: +56 9 1234 5678",
        "Email: cronoselegancee@gmail.com"
    ]
    
    for info in company_info:
        elements.append(Paragraph(info, styles['Normal']))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Información de la orden
    elements.append(Paragraph(f"<b>N° Orden:</b> {orden.id}", styles['Normal']))
    elements.append(Paragraph(f"<b>Fecha:</b> {localtime(orden.fecha_creacion).strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Paragraph(f"<b>Cliente:</b> {orden.usuario.username}", styles['Normal']))
    elements.append(Paragraph(f"<b>Email:</b> {orden.usuario.email}", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Dirección de envío
    elements.append(Paragraph("<b>Dirección de Envío:</b>", styles['Normal']))
    elements.append(Paragraph(f"{orden.direccion}, {orden.comuna}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Detalles de productos
    elements.append(Paragraph("<b>Detalle de Productos:</b>", styles['Heading2']))
    
    # Tabla de productos
    data = [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']]
    
    for item in orden.carrito.items.all():
        data.append([
            item.producto.nombre,
            str(item.cantidad),
            f"${item.producto.precio:,.0f}",
            f"${item.subtotal():,.0f}"
        ])
    
    table = Table(data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b2b2b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#FFD700')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#1e1e1e')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.white)
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Total
    elements.append(Paragraph(f"<b>TOTAL: ${orden.total:,.0f}</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Mensaje de agradecimiento
    elements.append(Paragraph("¡Gracias por su compra!", styles['Normal']))
    elements.append(Paragraph("Su pedido será procesado y enviado a la brevedad.", styles['Normal']))
    
    # Construir PDF
    doc.build(elements)
    
    # Obtener el contenido del PDF
    pdf = buffer.getvalue()
    buffer.close()
    
    return pdf

def enviar_boleta_email(orden):
    """Envía la boleta por email al cliente"""
    try:
        # Generar PDF
        pdf_content = generar_boleta_pdf(orden)
        
        # Asunto y mensaje
        subject = f'Cronos Elegance - Boleta de Compra N° {orden.id}'
        message = f'''
        Hola {orden.usuario.username},
        
        ¡Gracias por tu compra en Cronos Elegance!
        
        Tu pedido ha sido procesado exitosamente.
        
        **Detalles de tu compra:**
        - N° de Orden: {orden.id}
        - Total: ${orden.total:,.0f}
        - Dirección de envío: {orden.direccion}, {orden.comuna}
        - Fecha: {localtime(orden.fecha_creacion).strftime('%d/%m/%Y %H:%M')}
        
        En el archivo adjunto encontrarás tu boleta electrónica.
        
        Tu pedido será enviado en un plazo de 3-5 días hábiles.
        
        Si tienes alguna pregunta, contáctanos en cronoselegancee@gmail.com
        
        ¡Gracias por confiar en Cronos Elegance!
        '''
        
        # Crear email
        email = EmailMessage(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [orden.usuario.email]
        )
        
        # Adjuntar PDF
        email.attach(
            f'boleta_cronos_elegance_{orden.id}.pdf',
            pdf_content,
            'application/pdf'
        )
        
        # Enviar email
        email.send(fail_silently=False)
        
        return True
        
    except Exception as e:
        print(f"Error enviando email: {str(e)}")
        return False
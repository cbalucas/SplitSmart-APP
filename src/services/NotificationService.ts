import { Linking, Alert } from 'react-native';

interface PaymentNotificationData {
  payerName: string;
  amount: number;
  eventName: string;
  recipientPhone: string;
  receiptImage?: string;
}

class NotificationService {
  
  // Generar enlace de imagen dinámica para el comprobante
  private generateReceiptImageUrl(data: PaymentNotificationData): string {
    // Usar un servicio como placeholder.com o crear una imagen dinámica
    const params = new URLSearchParams({
      text: `Pago Recibido\nDe: ${data.payerName}\nMonto: $${data.amount}\nEvento: ${data.eventName}`,
      bg: '4CAF50',
      color: 'white',
      size: '400x300'
    });
    return `https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=SplitSmart%0APago+Recibido%0A$${data.amount}`;
  }
  
  // Abrir WhatsApp directamente (Opción 1)
  private openWhatsApp(phone: string, message: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => console.error('Error opening WhatsApp:', err));
  }

  // Notificar pago recibido (liquidación) - Abre WhatsApp directamente
  async notifyPaymentReceived(data: PaymentNotificationData) {
    try {
      if (!data.recipientPhone) {
        Alert.alert(
          "⚠️ Notificación no enviada",
          "No se puede hacer el envío, debido que el acreedor no posee número de teléfono cargado.",
          [{ text: "Entendido", style: "default" }]
        );
        console.log('No phone number provided for payment notification');
        return;
      }

      // Construir mensaje con el nuevo diseño
      let whatsappMessage = `💰 *SplitSmart - Has recibido un pago:* 💰\n\n💸 *De:* ${data.payerName}\n💵 *Monto:* $${data.amount}\n🎊 *Evento:* ${data.eventName}`;
      
      // Agregar línea de comprobante solo si existe
      if (data.receiptImage) {
        whatsappMessage += `\n🧾 *Comprobante:* Enviado`;
      }
      
      whatsappMessage += `\n\n_Enviado desde SplitSmart App_ 📱`;
      
      // Abrir WhatsApp directamente (Opción 1)
      this.openWhatsApp(data.recipientPhone, whatsappMessage);
      
      console.log(`✅ WhatsApp payment notification sent to ${data.recipientPhone}`);
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
#!/usr/bin/env python3
"""
Tilet3D Remaining Locales Injector
Adds translations across all 7 supported languages for remaining surfaces:
- Avatar viewer biometrics HUD
- Order details & checkout receipt
- Rental status badges & modal labels
- AI Floating Assistant actions
- Cultural explore actions
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE_DIR, "frontend", "public", "locales")

LANGUAGES = ["om", "am", "en", "ti", "fr", "ar", "sw"]

UPDATES = {
    "en": {
        "avatar": {
            "chestLabel": "Chest",
            "waistLabel": "Waist",
            "hipsLabel": "Hips",
            "body": "Body",
            "walkTestPremium": "Walk Test is a Premium feature",
            "premium": "Premium"
        },
        "cultural": {
            "exploreAll": "Explore All →",
            "explore": "Explore →"
        },
        "rentals": {
            "confirmed": "Confirmed",
            "readyForPickup": "Ready for Pickup",
            "outOnRental": "Out on Rental",
            "returnedPendingInspection": "Returned (Inspecting)",
            "completed": "Completed",
            "overdue": "Overdue",
            "pendingPayment": "Payment Pending",
            "cancelled": "Cancelled",
            "depositHeld": "Deposit Held",
            "depositRefunded": "Deposit Refunded",
            "partiallyRefunded": "Partially Refunded",
            "depositForfeited": "Deposit Forfeited",
            "days": "days",
            "size": "Size:",
            "pickupLocation": "Shop Pickup at Bole Atelier",
            "courierDelivery": "Doorstep Courier Delivery"
        },
        "orders": {
            "orderTitle": "Order",
            "placedOn": "Placed on",
            "itemsOrdered": "Items Ordered",
            "customerNote": "Customer Note",
            "summary": "Summary",
            "subtotal": "Subtotal",
            "shipping": "Shipping",
            "tax": "Tax",
            "discount": "Discount",
            "total": "Total",
            "delivery": "Delivery",
            "payment": "Payment",
            "paidViaChapa": "Paid via Chapa",
            "backToOrders": "Back to Orders",
            "notFound": "Order not found."
        },
        "checkout": {
            "printReceipt": "Print / Save Receipt",
            "viewOrderStatus": "View Order Status",
            "officialReceipt": "Official Receipt",
            "atelierSubtitle": "Ethiopian Heritage Fashion & Custom 3D Tailoring",
            "atelierLocation": "Addis Ababa, Ethiopia • support@tilet3d.com",
            "orderDate": "Date:",
            "paidVerified": "PAID (Verified via Chapa)",
            "chapaGateway": "Chapa Gateway",
            "qty": "Qty:",
            "deliveryAddress": "Delivery Address",
            "verifyingPayment": "Verifying Payment with Chapa...",
            "verifyingDesc": "Please wait a moment while we confirm your transaction and generate your official order receipt.",
            "receiptUnavailable": "Receipt Unavailable",
            "receiptUnavailableDesc": "We couldn't retrieve the receipt details for this order.",
            "goToOrders": "Go to My Orders",
            "returnHome": "Return to Home"
        },
        "ai": {
            "log": "Log",
            "tryAsking": "Try asking",
            "askTilet": "Ask Tilet3D...",
            "continueConversation": "Continue conversation...",
            "voiceInput": "Voice input",
            "sendMessage": "Send message",
            "closeAssistant": "Close AI assistant"
        }
    },
    "om": {
        "avatar": {
            "chestLabel": "Qoma",
            "waistLabel": "Mudhii",
            "hipsLabel": "Mudhii Gadii",
            "body": "Qaama",
            "walkTestPremium": "Madaallii Deemsaa tajaajila addaati",
            "premium": "Addaa"
        },
        "cultural": {
            "exploreAll": "Hundaa Daawwadhaa →",
            "explore": "Daawwadhaa →"
        },
        "rentals": {
            "confirmed": "Mirkanaa'e",
            "readyForPickup": "Fudhachuuf Qophii",
            "outOnRental": "Kireeffamee Jira",
            "returnedPendingInspection": "Deebi'e (Qoratamaa)",
            "completed": "Xumurame",
            "overdue": "Yeroon Darbe",
            "pendingPayment": "Kaffaltii Eegaa Jira",
            "cancelled": "Haqame",
            "depositHeld": "Wabii Qabame",
            "depositRefunded": "Wabii Deebi'e",
            "partiallyRefunded": "Gartokkeen Deebi'e",
            "depositForfeited": "Wabii Hin Deebine",
            "days": "guyyoota",
            "size": "Hamma:",
            "pickupLocation": "Ateeliyeerii Boolee irraa fudhachuu",
            "courierDelivery": "Ergamaadhaan Mana Gayuu"
        },
        "orders": {
            "orderTitle": "Ajaja",
            "placedOn": "Guyyaa ajajame",
            "itemsOrdered": "Meeshaalee Ajajaman",
            "customerNote": "Yaada Maamilaa",
            "summary": "Cuunfaa",
            "subtotal": "Waliigala Duraa",
            "shipping": "Geejjiba",
            "tax": "Gibira",
            "discount": "Gadi-bu'aa",
            "total": "Dimshaasha",
            "delivery": "Dhiheessa",
            "payment": "Kaffaltii",
            "paidViaChapa": "Chaapaadhaan Kaffalame",
            "backToOrders": "Gara Ajajaatti Deebi'i",
            "notFound": "Ajajni hin argamne."
        },
        "checkout": {
            "printReceipt": "Ragaa Maxxansi / Qabi",
            "viewOrderStatus": "Haala Ajajaa Ilaali",
            "officialReceipt": "Ragaa Seera Qabeessa",
            "atelierSubtitle": "Uffata Aadaa Itoophiyaa fi Suuraa 3D",
            "atelierLocation": "Finfinnee, Itoophiyaa • support@tilet3d.com",
            "orderDate": "Guyyaa:",
            "paidVerified": "KAFFALAME (Chaapaadhaan Mirkanaa'e)",
            "chapaGateway": "Karaa Chaapaa",
            "qty": "Baay'ina:",
            "deliveryAddress": "Teessoo Dhiheessaa",
            "verifyingPayment": "Chaapaa waliin kaffaltii mirkaneessaa jira...",
            "verifyingDesc": "Hanga daldala keessan mirkaneessinee ragaa ajajaa keessanii qopheessinutti mee xiqqoo eegaa.",
            "receiptUnavailable": "Ragaan Hin Argamne",
            "receiptUnavailableDesc": "Odeeffannoo ragaa ajaja kanaa argachuu hin dandeenye.",
            "goToOrders": "Gara Ajaja Kootti Dhaqi",
            "returnHome": "Gara Fuula Duraatti Deebi'i"
        },
        "ai": {
            "log": "Galmee",
            "tryAsking": "Mee gaafadhaa",
            "askTilet": "Tilet3D gaafadhaa...",
            "continueConversation": "Hasaa itti fufaa...",
            "voiceInput": "Sagaleedhaan galchuu",
            "sendMessage": "Ergaa ergi",
            "closeAssistant": "Gargaaraa AI cufi"
        }
    },
    "am": {
        "avatar": {
            "chestLabel": "ደረት",
            "waistLabel": "ወገብ",
            "hipsLabel": "ዳሌ",
            "body": "ሰውነት",
            "walkTestPremium": "የእርምጃ ሙከራ ልዩ (ፕሪሚየም) አገልግሎት ነው",
            "premium": "ፕሪሚየም"
        },
        "cultural": {
            "exploreAll": "ሁሉንም ያስሱ →",
            "explore": "ያስሱ →"
        },
        "rentals": {
            "confirmed": "ተረጋግጧል",
            "readyForPickup": "ለመረከብ ዝግጁ",
            "outOnRental": "ተከራይቶ ወጥቷል",
            "returnedPendingInspection": "ተመልሷል (በምርመራ ላይ)",
            "completed": "ተጠናቋል",
            "overdue": "ጊዜው ያለፈበት",
            "pendingPayment": "ክፍያ በመጠባበቅ ላይ",
            "cancelled": "ተሰርዟል",
            "depositHeld": "ተቀማጭ ተይዟል",
            "depositRefunded": "ተቀማጭ ተመላሽ ተደርጓል",
            "partiallyRefunded": "በከፊል ተመላሽ ተደርጓል",
            "depositForfeited": "ተቀማጭ ቀርቷል",
            "days": "ቀናት",
            "size": "መጠን፦",
            "pickupLocation": "ከቦሌ አቴሌ ቅርንጫፍ መረከብ",
            "courierDelivery": "በመልዕክተኛ እስከ ደጅ ማድረስ"
        },
        "orders": {
            "orderTitle": "ትዕዛዝ",
            "placedOn": "የታዘዘበት ቀን",
            "itemsOrdered": "የታዘዙ ዕቃዎች",
            "customerNote": "የደንበኛ ማስታወሻ",
            "summary": "ማጠቃለያ",
            "subtotal": "ንዑስ ድምር",
            "shipping": "ማጓጓዣ",
            "tax": "ግብር",
            "discount": "ቅናሽ",
            "total": "ጠቅላላ ድምር",
            "delivery": "ርክክብ",
            "payment": "ክፍያ",
            "paidViaChapa": "በቻፓ የተከፈለ",
            "backToOrders": "ወደ ትዕዛዞች ተመለስ",
            "notFound": "ትዕዛዙ አልተገኘም።"
        },
        "checkout": {
            "printReceipt": "ደረሰኝ አትም / አስቀምጥ",
            "viewOrderStatus": "የትዕዛዝ ሁኔታ ይመልከቱ",
            "officialReceipt": "ይፋዊ ደረሰኝ",
            "atelierSubtitle": "የኢትዮጵያ ባህላዊ አልባሳትና የ3D ልኬት",
            "atelierLocation": "አዲስ አበባ፣ ኢትዮጵያ • support@tilet3d.com",
            "orderDate": "ቀን፦",
            "paidVerified": "ተከፍሏል (በቻፓ የተረጋገጠ)",
            "chapaGateway": "የቻፓ ጌትዌይ",
            "qty": "ብዛት፦",
            "deliveryAddress": "የማድረሻ አድራሻ",
            "verifyingPayment": "ከቻፓ ጋር ክፍያን በማረጋገጥ ላይ...",
            "verifyingDesc": "ግብይትዎን አረጋግጠን ይፋዊ የትዕዛዝ ደረሰኝዎን እስክናዘጋጅ ድረስ እባክዎ ትንሽ ይጠብቁ።",
            "receiptUnavailable": "ደረሰኙ አልተገኘም",
            "receiptUnavailableDesc": "ለዚህ ትዕዛዝ የደረሰኝ ዝርዝር መረጃ ማግኘት አልተቻለም።",
            "goToOrders": "ወደ ትዕዛዞቼ ይሂዱ",
            "returnHome": "ወደ መነሻ ገጽ ተመለስ"
        },
        "ai": {
            "log": "መዝገብ",
            "tryAsking": "ይህን ይጠይቁ",
            "askTilet": "Tilet3Dን ይጠይቁ...",
            "continueConversation": "ውይይቱን ይቀጥሉ...",
            "voiceInput": "በድምፅ ማስገባት",
            "sendMessage": "መልእክት ላክ",
            "closeAssistant": "የAI ረዳቱን ዝጋ"
        }
    },
    "ti": {
        "avatar": {
            "chestLabel": "ደረት",
            "waistLabel": "ሕቆ",
            "hipsLabel": "ዳሌ",
            "body": "ሰብነት",
            "walkTestPremium": "ናይ ስጉምቲ ፈተነ ፍሉይ (ፕሪምየም) ኣገልግሎት እዩ",
            "premium": "ፕሪሚየም"
        },
        "cultural": {
            "exploreAll": "ንኹሉ ዳህስስ →",
            "explore": "ዳህስስ →"
        },
        "rentals": {
            "confirmed": "ተረጋጊጹ",
            "readyForPickup": "ንቕበላ ድሉው",
            "outOnRental": "ተኻርዩ ወፂኡ",
            "returnedPendingInspection": "ተመሊሱ (ይምርመር ኣሎ)",
            "completed": "ተዛዚሙ",
            "overdue": "ግዜኡ ዝሓለፎ",
            "pendingPayment": "ክፍሊት ይጽበ ኣሎ",
            "cancelled": "ተሰሪዙ",
            "depositHeld": "መተሓላለፊ ተታሒዙ",
            "depositRefunded": "መተሓላለፊ ተመሊሱ",
            "partiallyRefunded": "ብኽፋል ተመሊሱ",
            "depositForfeited": "መተሓላለፊ ተወሲዱ",
            "days": "መዓልትታት",
            "size": "መጠን፦",
            "pickupLocation": "ካብ ቦሌ ኣቴሌ ምቕባል",
            "courierDelivery": "ብመልእኽተኛ ናብ ገዛ ምብጻሕ"
        },
        "orders": {
            "orderTitle": "ትእዛዝ",
            "placedOn": "እተኣዘዘሉ መዓልቲ",
            "itemsOrdered": "እተኣዘዙ ኣቑሑ",
            "customerNote": "ናይ ዓሚል መዘከርታ",
            "summary": "ጽሟቕ",
            "subtotal": "ንኡስ ድምር",
            "shipping": "ምጉዕዓዝ",
            "tax": "ግብሪ",
            "discount": "ቅናሽ",
            "total": "ሓፈሻዊ ድምር",
            "delivery": "ምብጻሕ",
            "payment": "ክፍሊት",
            "paidViaChapa": "ብቻፓ እተኸፍለ",
            "backToOrders": "ናብ ትእዛዛት ተመለስ",
            "notFound": "ትእዛዝ ኣይተረኽበን።"
        },
        "checkout": {
            "printReceipt": "ደረሰኝ ኣሕትም / ኣቀምጥ",
            "viewOrderStatus": "ኩነታት ትእዛዝ ርአ",
            "officialReceipt": "ወግዓዊ ደረሰኝ",
            "atelierSubtitle": "ናይ ኢትዮጵያ ባህላዊ ክዳውንትን 3D ልክዕን",
            "atelierLocation": "ኣዲስ ኣበባ፣ ኢትዮጵያ • support@tilet3d.com",
            "orderDate": "ዕለት፦",
            "paidVerified": "ተኸፊሉ (ብቻፓ እተረጋገጸ)",
            "chapaGateway": "ናይ ቻፓ ኣፍደገ",
            "qty": "ብዝሒ፦",
            "deliveryAddress": "ናይ ምብጻሕ ኣድራሻ",
            "verifyingPayment": "ምስ ቻፓ ክፍሊት የረጋግጽ ኣሎ...",
            "verifyingDesc": "ትራንዛክሽንኩም ኣረጋጊጽና ወግዓዊ ደረሰኝ ትእዛዝኩም ክሳብ ነዳሉ ብኽብረትኩም ንእሽቶ ተጸበዩ።",
            "receiptUnavailable": "ደረሰኝ ኣይተረኽበን",
            "receiptUnavailableDesc": "ናይዚ ትእዛዝ ናይ ደረሰኝ ዝርዝር ክንረክብ ኣይከኣልናን።",
            "goToOrders": "ናብ ትእዛዛተይ ኪድ",
            "returnHome": "ናብ መበገሲ ገጽ ተመለስ"
        },
        "ai": {
            "log": "መዝገብ",
            "tryAsking": "ነዚ ሕተቱ",
            "askTilet": "ንTilet3D ሕተቱ...",
            "continueConversation": "ዕላል ቀጽሉ...",
            "voiceInput": "ብድምጺ ምእታው",
            "sendMessage": "መልእኽቲ ስደድ",
            "closeAssistant": "ናይ AI ሓጋዚ ዕጸዎ"
        }
    },
    "fr": {
        "avatar": {
            "chestLabel": "Poitrine",
            "waistLabel": "Taille",
            "hipsLabel": "Hanches",
            "body": "Corps",
            "walkTestPremium": "Le test de marche est une fonctionnalité Premium",
            "premium": "Premium"
        },
        "cultural": {
            "exploreAll": "Tout explorer →",
            "explore": "Explorer →"
        },
        "rentals": {
            "confirmed": "Confirmé",
            "readyForPickup": "Prêt pour le retrait",
            "outOnRental": "En location",
            "returnedPendingInspection": "Retourné (Inspection en cours)",
            "completed": "Terminé",
            "overdue": "En retard",
            "pendingPayment": "Paiement en attente",
            "cancelled": "Annulé",
            "depositHeld": "Dépôt retenu",
            "depositRefunded": "Dépôt remboursé",
            "partiallyRefunded": "Partiellement remboursé",
            "depositForfeited": "Dépôt perdu",
            "days": "jours",
            "size": "Taille :",
            "pickupLocation": "Retrait à l'Atelier Bole",
            "courierDelivery": "Livraison à domicile"
        },
        "orders": {
            "orderTitle": "Commande",
            "placedOn": "Passée le",
            "itemsOrdered": "Articles commandés",
            "customerNote": "Note du client",
            "summary": "Récapitulatif",
            "subtotal": "Sous-total",
            "shipping": "Livraison",
            "tax": "Taxe",
            "discount": "Remise",
            "total": "Total",
            "delivery": "Livraison",
            "payment": "Paiement",
            "paidViaChapa": "Payé via Chapa",
            "backToOrders": "Retour aux commandes",
            "notFound": "Commande introuvable."
        },
        "checkout": {
            "printReceipt": "Imprimer / Enregistrer le reçu",
            "viewOrderStatus": "Voir l'état de la commande",
            "officialReceipt": "Reçu officiel",
            "atelierSubtitle": "Mode traditionnelle éthiopienne & confection 3D sur mesure",
            "atelierLocation": "Addis-Abeba, Éthiopie • support@tilet3d.com",
            "orderDate": "Date :",
            "paidVerified": "PAYÉ (Vérifié via Chapa)",
            "chapaGateway": "Passerelle Chapa",
            "qty": "Qté :",
            "deliveryAddress": "Adresse de livraison",
            "verifyingPayment": "Vérification du paiement avec Chapa...",
            "verifyingDesc": "Veuillez patienter pendant que nous confirmons votre transaction et générons votre reçu officiel.",
            "receiptUnavailable": "Reçu indisponible",
            "receiptUnavailableDesc": "Nous n'avons pas pu récupérer les détails du reçu pour cette commande.",
            "goToOrders": "Aller à mes commandes",
            "returnHome": "Retour à l'accueil"
        },
        "ai": {
            "log": "Historique",
            "tryAsking": "Essayez de demander",
            "askTilet": "Demandez à Tilet3D...",
            "continueConversation": "Poursuivre la conversation...",
            "voiceInput": "Entrée vocale",
            "sendMessage": "Envoyer le message",
            "closeAssistant": "Fermer l'assistant IA"
        }
    },
    "ar": {
        "avatar": {
            "chestLabel": "الصدر",
            "waistLabel": "الخصر",
            "hipsLabel": "الأرداف",
            "body": "الجسم",
            "walkTestPremium": "اختبار المشي ميزة ممتازة",
            "premium": "مميز"
        },
        "cultural": {
            "exploreAll": "استكشف الكل ←",
            "explore": "استكشف ←"
        },
        "rentals": {
            "confirmed": "مؤكد",
            "readyForPickup": "جاهز للاستلام",
            "outOnRental": "مستأجر حالياً",
            "returnedPendingInspection": "تم الإرجاع (قيد الفحص)",
            "completed": "مكتمل",
            "overdue": "متأخر",
            "pendingPayment": "الدفع معلق",
            "cancelled": "ملغى",
            "depositHeld": "الوديعة محجوزة",
            "depositRefunded": "تم استرداد الوديعة",
            "partiallyRefunded": "مسترد جزئياً",
            "depositForfeited": "الوديعة مصادرة",
            "days": "أيام",
            "size": "المقاس:",
            "pickupLocation": "استلام من أتيليه بولي",
            "courierDelivery": "توصيل للمنزل"
        },
        "orders": {
            "orderTitle": "طلب",
            "placedOn": "تم الطلب في",
            "itemsOrdered": "العناصر المطلوبة",
            "customerNote": "ملاحظة العميل",
            "summary": "الملخص",
            "subtotal": "المجموع الفرعي",
            "shipping": "الشحن",
            "tax": "الضريبة",
            "discount": "الخصم",
            "total": "المجموع الإجمالي",
            "delivery": "التوصيل",
            "payment": "الدفع",
            "paidViaChapa": "تم الدفع عبر تشابا",
            "backToOrders": "العودة للطلبات",
            "notFound": "الطلب غير موجود."
        },
        "checkout": {
            "printReceipt": "طباعة / حفظ الإيصال",
            "viewOrderStatus": "عرض حالة الطلب",
            "officialReceipt": "إيصال رسمي",
            "atelierSubtitle": "أزياء التراث الإثيوبي والخياطة ثلاثية الأبعاد المخصصة",
            "atelierLocation": "أديس أبابا، إثيوبيا • support@tilet3d.com",
            "orderDate": "التاريخ:",
            "paidVerified": "مدفوع (تم التحقق عبر تشابا)",
            "chapaGateway": "بوابة تشابا",
            "qty": "الكمية:",
            "deliveryAddress": "عنوان التوصيل",
            "verifyingPayment": "جارٍ التحقق من الدفع مع تشابا...",
            "verifyingDesc": "يرجى الانتظار لحظة بينما نؤكد معاملتك وننشئ إيصال طلبك الرسمي.",
            "receiptUnavailable": "الإيصال غير متوفر",
            "receiptUnavailableDesc": "تعذر استرداد تفاصيل الإيصال لهذا الطلب.",
            "goToOrders": "الانتقال إلى طلباتي",
            "returnHome": "العودة للرئيسية"
        },
        "ai": {
            "log": "السجل",
            "tryAsking": "جرب أن تسأل",
            "askTilet": "اسأل Tilet3D...",
            "continueConversation": "متابعة المحادثة...",
            "voiceInput": "الإدخال الصوتي",
            "sendMessage": "إرسال الرسالة",
            "closeAssistant": "إغلاق المساعد الذكي"
        }
    },
    "sw": {
        "avatar": {
            "chestLabel": "Kifua",
            "waistLabel": "Kiuno",
            "hipsLabel": "Nyonga",
            "body": "Mwili",
            "walkTestPremium": "Kipimo cha kutembea ni huduma ya Kulipia",
            "premium": "Bora"
        },
        "cultural": {
            "exploreAll": "Gundua Yote →",
            "explore": "Gundua →"
        },
        "rentals": {
            "confirmed": "Imethibitishwa",
            "readyForPickup": "Tayari Kuchukuliwa",
            "outOnRental": "Imekodishwa",
            "returnedPendingInspection": "Imerudishwa (Inakaguliwa)",
            "completed": "Imekamilika",
            "overdue": "Imechelewa",
            "pendingPayment": "Malipo Yanasubiriwa",
            "cancelled": "Imeghairiwa",
            "depositHeld": "Amana Imeshikiliwa",
            "depositRefunded": "Amana Imerudishwa",
            "partiallyRefunded": "Imerudishwa Kiasi",
            "depositForfeited": "Amana Imepotea",
            "days": "siku",
            "size": "Ukubwa:",
            "pickupLocation": "Kuchukua katika Atelier ya Bole",
            "courierDelivery": "Uwasilishaji Mlangoni"
        },
        "orders": {
            "orderTitle": "Agizo",
            "placedOn": "Iliagizwa mnamo",
            "itemsOrdered": "Vitu Vilivyoagizwa",
            "customerNote": "Ujumbe wa Mteja",
            "summary": "Muhtasari",
            "subtotal": "Jumla Ndogo",
            "shipping": "Usafirishaji",
            "tax": "Kodi",
            "discount": "Punguzo",
            "total": "Jumla",
            "delivery": "Uwasilishaji",
            "payment": "Malipo",
            "paidViaChapa": "Imelipwa kupitia Chapa",
            "backToOrders": "Rudi kwenye Maagizo",
            "notFound": "Agizo halikupatikana."
        },
        "checkout": {
            "printReceipt": "Chapisha / Hifadhi Risiti",
            "viewOrderStatus": "Tazama Hali ya Agizo",
            "officialReceipt": "Risiti Rasmi",
            "atelierSubtitle": "Mitindo ya Jadi ya Ethiopia na Ushonaji wa 3D",
            "atelierLocation": "Addis Ababa, Ethiopia • support@tilet3d.com",
            "orderDate": "Tarehe:",
            "paidVerified": "IMELIPWA (Imethibitishwa kupitia Chapa)",
            "chapaGateway": "Lango la Chapa",
            "qty": "Idadi:",
            "deliveryAddress": "Anwani ya Uwasilishaji",
            "verifyingPayment": "Inathibitisha malipo na Chapa...",
            "verifyingDesc": "Tafadhali subiri kidogo tunapothibitisha muamala wako na kutoa risiti rasmi ya agizo lako.",
            "receiptUnavailable": "Risiti Haipatikani",
            "receiptUnavailableDesc": "Hatuwezi kupata maelezo ya risiti ya agizo hili.",
            "goToOrders": "Nenda kwenye Maagizo Yangu",
            "returnHome": "Rudi Nyumbani"
        },
        "ai": {
            "log": "Kumbukumbu",
            "tryAsking": "Jaribu kuuliza",
            "askTilet": "Uliza Tilet3D...",
            "continueConversation": "Endelea na mazungumzo...",
            "voiceInput": "Uingizaji wa sauti",
            "sendMessage": "Tuma ujumbe",
            "closeAssistant": "Funga msaidizi wa AI"
        }
    }
}

def deep_merge(target, source):
    for key, value in source.items():
        if isinstance(value, dict) and key in target and isinstance(target[key], dict):
            deep_merge(target[key], value)
        else:
            target[key] = value

def main():
    print("Injecting remaining localized keys across all 7 locales...")
    for lang in LANGUAGES:
        path = os.path.join(LOCALES_DIR, lang, "translation.json")
        if not os.path.exists(path):
            print(f"Skipping {lang}, file not found")
            continue
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        deep_merge(data, UPDATES[lang])
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  [OK] Updated {lang}/translation.json")

if __name__ == "__main__":
    main()

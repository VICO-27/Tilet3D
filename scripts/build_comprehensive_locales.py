#!/usr/bin/env python3
"""
Tilet3D Comprehensive Locale Generator
Injects all missing keys across all 7 supported languages:
- om: Afaan Oromoo (Primary domestic Ethiopian language)
- am: አማርኛ / Amharic (Primary domestic Ethiopian language)
- en: English (International fallback)
- ti: ትግርኛ / Tigrinya (Ethiopian regional)
- fr: Français / French
- ar: العربية / Arabic (RTL)
- sw: Kiswahili / Swahili
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE_DIR, "frontend", "public", "locales")

LANGUAGES = ["om", "am", "en", "ti", "fr", "ar", "sw"]

EXTENSIONS = {
    "en": {
        "common": {
            "details": "Details",
            "unisex": "Unisex",
            "back": "Back",
            "loading": "Loading..."
        },
        "hero": {
            "gender": {
                "female": "Female",
                "male": "Male"
            }
        },
        "howItWorks": {
            "badge": "How it works",
            "titleLead": "From measurement",
            "titleAccent": "to perfect fit.",
            "subtitle": "Tilet3D turns traditional Habesha tailoring into an effortless, real-time 3D experience.",
            "stepLabel": "STEP",
            "step1": {
                "title": "Create your avatar",
                "desc": "Enter a few measurements and Tilet3D builds a realistic 3D version of you for accurate virtual fitting."
            },
            "step2": {
                "title": "Try on Habesha couture",
                "desc": "See authentic handwoven garments on your avatar in real time. Rotate, zoom and inspect every thread."
            },
            "step3": {
                "title": "Order with confidence",
                "desc": "Choose the design you love and order knowing exactly how it looks and fits before tailoring begins."
            }
        },
        "featured": {
            "atelier": "TILET3D ATELIER",
            "title": "Featured Collection",
            "tagline": "Which one speaks to you?",
            "viewDetails": "View Details",
            "loadingMore": "Loading More..."
        },
        "cultural": {
            "title": "Cultural Heritage.",
            "wedding": "Wedding.",
            "oromo": "Oromo.",
            "tigray": "Tigray.",
            "amhara": "Amhara.",
            "weddingDesc": "Wedding Collection",
            "oromoDesc": "A tapestry of tradition. Each thread tells a story of generations past, woven into the fabric of modern elegance.",
            "tigrayDesc": "Rooted in history. The vibrant patterns and meticulous craftsmanship reflect a rich, diverse heritage spanning centuries.",
            "amharaDesc": "Timeless grace. Celebrating the distinct beauty and enduring spirit of Ethiopian artistry in every stitch.",
            "noProducts": "No products found for"
        },
        "products": {
            "tryOn": "Try-on Avatar",
            "rent": "Rent",
            "bespoke": "Bespoke Order",
            "backToCollection": "Back to collection",
            "addNote": "Add note on couture...",
            "post": "Post",
            "sortBy": "Sort By",
            "sortNewest": "Newest Arrivals",
            "sortPriceAsc": "Price: Low → High",
            "sortPriceDesc": "Price: High → Low",
            "sortRelevance": "Relevance",
            "categoriesLabel": "Category",
            "priceRange": "Price Range",
            "budgetPrice": "Budget (<2K)",
            "midPrice": "Mid-range",
            "premiumPrice": "Premium",
            "inStockOnly": "In Stock Only",
            "viewResults": "View Results",
            "card": {
                "addToCart": "Add to Cart (Purchase)",
                "addedToCart": "Added to Cart",
                "front": "Front",
                "back": "Back",
                "top": "Top",
                "view": "View"
            }
        },
        "detail": {
            "notFound": "This product couldn't be found.",
            "selectSizeFirst": "Select a size or variant first"
        },
        "cart": {
            "addedToCart": "Added to cart"
        },
        "rentals": {
            "title": "Rentals",
            "noRentals": "No Rentals Yet",
            "browseRentals": "Browse Rentable Pieces",
            "durationOptions": "Rental Duration Options",
            "fixedPackage": "Fixed Package",
            "customDates": "Custom Dates",
            "daysAccess": "Days Full Access",
            "available": "Garment Available",
            "pickupTitle": "Atelier Pickup & Return",
            "pickupSubtitle": "Free · Bole Medhanialem",
            "deliveryTitle": "Courier Delivery",
            "deliveryFee": "Doorstep Delivery & Return",
            "duration": "Rental Duration",
            "agreement": "I agree to the Tilet3D Rental & Cultural Garment Care Policy. The security deposit will be automatically cleared upon standard atelier inspection.",
            "agreePrompt": "Please agree to the Cultural Garment Care Policy to continue.",
            "reserveBtn": "Confirm & Pay via Chapa",
            "unavailableTitle": "Rental Currently Unavailable",
            "unavailableDesc": "This artisanal piece is currently not available for rental. You can still purchase this garment directly.",
            "periodLabel": "Rental Period:",
            "statusLabel": "Current Status:",
            "fulfillmentLabel": "Fulfillment Method:",
            "addressLabel": "Delivery Address:",
            "subtotalLabel": "Rental Subtotal:",
            "depositLabel": "Security Deposit:",
            "deliveryFeeLabel": "Delivery Fee:",
            "totalLabel": "Total Amount:"
        },
        "checkout": {
            "tax": "Tax (15% VAT)",
            "shippingFee": "Shipping",
            "totalDue": "Total Due",
            "region": "Region",
            "subCity": "Sub City",
            "woreda": "Woreda",
            "houseNo": "House No.",
            "deliveryNote": "Delivery Note (Optional)",
            "chapaSecure": "🔒 Safe, 256-bit encrypted payment powered by Chapa. Ethiopian Birr (ETB).",
            "addressRequired": "Delivery address is required for white-glove courier fulfillment.",
            "secureEncryption": "Secure Encryption",
            "orderNumber": "Order Number",
            "paymentStatus": "Payment Status",
            "paymentProvider": "Payment Provider",
            "transactionId": "Transaction ID",
            "orderNote": "Order Note",
            "itemDescription": "Item Description",
            "price": "Price",
            "total": "Total",
            "itemsOrdered": "Items Ordered",
            "customerNote": "Customer Note",
            "summary": "Summary",
            "subtotal": "Subtotal",
            "discount": "Discount",
            "goBack": "Go Back",
            "continueShopping": "Continue Shopping"
        },
        "avatar": {
            "nickname": "Nickname",
            "age": "Age",
            "bodyType": "Body Type",
            "shoulder": "Shoulder",
            "weight": "Weight",
            "controls": "Studio Controls",
            "controlsActive": "Controls Active",
            "editBody": "Edit Body",
            "confirmAvatar": "Confirm Avatar",
            "walkTest": "Walk Test",
            "spin360": "360° Spin",
            "biometrics": "Biometrics",
            "height": "Height",
            "structure": "Structure",
            "calibration": "Calibration",
            "coutureMatch": "Couture Match"
        },
        "ai": {
            "concierge": "Tilet Concierge",
            "ask": "Ask Tilet3D",
            "openFull": "Open full chat →",
            "welcome": "Hi! I'm your Tilet3D AI Concierge. How can I assist your couture journey today?",
            "minimise": "Minimise",
            "prompt": {
                "tryOn": "How does try-on work?",
                "outfit": "Help me pick an outfit",
                "whatsNew": "What's new in collection?"
            },
            "suggestions": {
                "kemis": "What Habesha Kemis designs are trending?",
                "netela": "What colors are available in Netela?",
                "tryon": "How does the 3D avatar try-on work?"
            }
        },
        "settings": {
            "preferencesTitle": "Regional & Preferences",
            "preferencesDesc": "Customize your currency, language, and notification experience.",
            "currencyLabel": "Preferred Currency",
            "languageLabel": "Display Language",
            "notificationsTitle": "Notification Preferences",
            "orderUpdates": "Order Updates",
            "orderUpdatesDesc": "Receive email alerts regarding delivery & payment status.",
            "promotions": "Promotions & Collections",
            "promotionsDesc": "Occasional updates on new designer drops and traditional wear sales.",
            "fittingRoomAlerts": "3D Fitting Room Alerts",
            "fittingRoomAlertsDesc": "Get notified when customized Habesha avatars or 3D meshes update.",
            "saveChanges": "Save Changes",
            "saved": "Saved!",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "Please sign in to add to your bag",
                "store": "Store",
                "returnToCollection": "Return to collection",
                "signIn": "Sign in",
                "createAccount": "Create account",
                "verifyEmail": "Verify email",
                "sendRecoveryCode": "Send recovery code",
                "updatePassword": "Update password"
            },
            "dashboard": {
                "interactive3d": "Interactive 3D Fit",
                "launchStudio": "Launch 3D Studio",
                "browseCollection": "Browse Collection",
                "viewFullHistory": "View Full History",
                "backToHome": "Back to Home"
            }
        },
        "admin": {
            "staffAuth": "Staff Environment",
            "loadingDetails": "Loading order details...",
            "refresh": "Refresh",
            "event": "Event",
            "user": "User",
            "ipAddress": "IP Address",
            "userAgent": "Client User-Agent",
            "timestamp": "Timestamp",
            "customer": "Customer",
            "email": "Email",
            "orders": "Orders",
            "totalSpent": "Total Spent",
            "joined": "Joined",
            "action": "Action",
            "category": "Category",
            "slug": "Slug",
            "assignedProducts": "Assigned Products",
            "status": "Status",
            "product": "Product",
            "unitPrice": "Unit Price",
            "physicalStock": "Physical Stock",
            "reserved": "Reserved",
            "available": "Available",
            "addProduct": "Add Product",
            "allCategories": "All Categories",
            "allStatuses": "All Statuses",
            "activeOnly": "Active Only",
            "inactiveOnly": "Inactive Only",
            "pending": "Pending",
            "confirmed": "Confirmed",
            "processing": "Processing",
            "shipped": "Shipped",
            "delivered": "Delivered",
            "amount": "Amount",
            "orderNumber": "Order Number",
            "gateway": "Gateway",
            "revenue": "Revenue",
            "unitsSold": "Units Sold"
        }
    },
    "om": {
        "common": {
            "details": "Bal'ina",
            "unisex": "Koorniyaa Lamaan",
            "back": "Duubatti",
            "loading": "Fe'amaa jira..."
        },
        "hero": {
            "gender": {
                "female": "Dubara",
                "male": "Dhiira"
            }
        },
        "howItWorks": {
            "badge": "Akkaataa Hojiirra Oolu",
            "titleLead": "Safartuu irraa kaasee",
            "titleAccent": "hanga qixa ta'utti.",
            "subtitle": "Tilet3D hodhaa aadaa Habashaa gara muuxannoo 3D salphaa fi kallattiitti jijjiira.",
            "stepLabel": "TARKANFII",
            "step1": {
                "title": "Avataara kee uumi",
                "desc": "Safartuu muraasa galchuun Tilet3D uffata sirriitti yaaluuf bifa 3D kee uuma."
            },
            "step2": {
                "title": "Uffata Habashaa yaali",
                "desc": "Uffata aadaa harkaatiin dhangala'e yeroo walfakkaatatti avataara keerratti ilaali. Naannessi, guddifadhuu bifa fooyya'aa ilaali."
            },
            "step3": {
                "title": "Amanamummaadhaan ajaji",
                "desc": "Dizaayinii jaallatte filadhuu osoo hin hodhamin dura akkamitti akka sitti ta'u beekii ajaji."
            }
        },
        "featured": {
            "atelier": "TILET3D AATELIYEE",
            "title": "Kuusaalee Filataman",
            "tagline": "Kamtu caalaatti si hawwata?",
            "viewDetails": "Bal'ina Ilaali",
            "loadingMore": "Dabalataan fe'amaa jira..."
        },
        "cultural": {
            "title": "Dhaala Aadaa.",
            "wedding": "Cidha.",
            "oromo": "Oromoo.",
            "tigray": "Tigraay.",
            "amhara": "Amaara.",
            "weddingDesc": "Kuusaa Cidhaa",
            "oromoDesc": "Dhaala aadaa bara dheeraa. Fo'aan hundi seenaa dhaloota darbee bareedina ammayyaatti hodha.",
            "tigrayDesc": "Hundee seenaa qabu. Bifti ajaa'ibaa fi hujiin harkaatiin hojjetame aadaa durii calaqqisiisa.",
            "amharaDesc": "Bareedina bara baraan jiraatu. Ogummaa fi aadaa Itoophiyaa hodhaa hunda keessatti kabaja.",
            "noProducts": "Oomishni hin argamne:"
        },
        "products": {
            "tryOn": "Avataara Yaali",
            "rent": "Kireeffadhu",
            "bespoke": "Ajaja Addaa",
            "backToCollection": "Gara Kuusaatti Deebi'i",
            "addNote": "Yaada uffatarratti barreessi...",
            "post": "Maxxansi",
            "sortBy": "Akkaataan Qindeessi",
            "sortNewest": "Haaraa Dhufe",
            "sortPriceAsc": "Gatii: Xiqqaa → Guddaa",
            "sortPriceDesc": "Gatii: Guddaa → Xiqqaa",
            "sortRelevance": "Walsimsiisa",
            "categoriesLabel": "Gosa",
            "priceRange": "Hangi Gatii",
            "budgetPrice": "Gatii Madaalawaa (<2K)",
            "midPrice": "Giddu-galeessa",
            "premiumPrice": "Olaanaa",
            "inStockOnly": "Mana Kuusaa Keessa Qofa",
            "viewResults": "Bu'aa Ilaali",
            "card": {
                "addToCart": "Gara Korbootti Dabali (Biti)",
                "addedToCart": "Korbootti Dabalameera",
                "front": "Fuuldura",
                "back": "Dugda",
                "top": "Gubbaa",
                "view": "Ilaali"
            }
        },
        "detail": {
            "notFound": "Oomishni kun hin argamne.",
            "selectSizeFirst": "Hammamtaa ykn gosa filadhu dura"
        },
        "cart": {
            "addedToCart": "Korbootti dabalameera"
        },
        "rentals": {
            "title": "Kireeffannaalee",
            "noRentals": "Hanga ammaa kireeffannaan hin jiru",
            "browseRentals": "Uffata Kireeffamu Barbaadi",
            "durationOptions": "Filannoowwan Yeroo Kireeffannaa",
            "fixedPackage": "Paakeejii Murtaa'aa",
            "customDates": "Guyyoota Filataman",
            "daysAccess": "Guyyoota Guutuu Qabaadhu",
            "available": "Uffanni Ni Jira",
            "pickupTitle": "Atelier irraa Fudhachuu fi Deebisuu",
            "pickupSubtitle": "Tola · Boolee Medhaanialam",
            "deliveryTitle": "Kuriyeeriin Dhiheessuu",
            "deliveryFee": "Balbala irratti Dhiheessuu fi Deebisuu",
            "duration": "Turtii Kireeffannaa",
            "agreement": "Imaammata Kireeffannaa fi Kunuunsa Uffata Aadaa Tilet3D nan fudhadha. Qorannoo booda qabsiisni deebifama.",
            "agreePrompt": "Itti fufuuf imaammata kunuunsa uffata aadaa waliigalaa.",
            "reserveBtn": "Mirkaneessi fi Chapa'n Kaffali",
            "unavailableTitle": "Kireeffannaan Yeroof Hin Jiraatu",
            "unavailableDesc": "Uffanni aadaa kun yeroo ammaa kireeffannaaf hin dhiyaanne. Kallattiin bituu dandeessu.",
            "periodLabel": "Yeroo Kireeffannaa:",
            "statusLabel": "Haala Ammaa:",
            "fulfillmentLabel": "Mala Dhiheessaa:",
            "addressLabel": "Teessoo Dhiheessaa:",
            "subtotalLabel": "Ida'ama Kireeffannaa:",
            "depositLabel": "Qabsiisa:",
            "deliveryFeeLabel": "Kaffaltii Dhiheessaa:",
            "totalLabel": "Ida'ama Guutuu:"
        },
        "checkout": {
            "tax": "Taaksii (15% VAT)",
            "shippingFee": "Dhiheessa",
            "totalDue": "Waliigala Kaffalamu",
            "region": "Naannoo",
            "subCity": "Kifla-Kutamaa",
            "woreda": "Aanaa",
            "houseNo": "Lakk. Manaa",
            "deliveryNote": "Yaada Dhiheessaa (Yoo jiraate)",
            "chapaSecure": "🔒 Kaffaltii eegamaa Chapa tiin kan hoogganamu. Birrii Itoophiyaa (ETB).",
            "addressRequired": "Tajaajila kuriyeeriitiif teessoon dhiheessaa barbaachisaadha.",
            "secureEncryption": "Cidha Eegumsaa",
            "orderNumber": "Lakk. Ajajaa",
            "paymentStatus": "Haala Kaffaltii",
            "paymentProvider": "Dhiheessaa Kaffaltii",
            "transactionId": "Eenyummaa Tiraanzaakshinii",
            "orderNote": "Yaada Ajajaa",
            "itemDescription": "Ibsa Mi'aa",
            "price": "Gatii",
            "total": "Ida'ama",
            "itemsOrdered": "Mi'oota Ajajaman",
            "customerNote": "Yaada Maamilaa",
            "summary": "Cuunfaa",
            "subtotal": "Ida'ama Xiqqaa",
            "discount": "Hir'ifama",
            "goBack": "Duubatti Deebi'i",
            "continueShopping": "Bittaa Itti Fufi"
        },
        "avatar": {
            "nickname": "Maqaa Dabalataa",
            "age": "Umrii",
            "bodyType": "Gosa Qaamaa",
            "shoulder": "Ceeku",
            "weight": "Ulfaatina",
            "controls": "To'annoo Istuudiyoo",
            "controlsActive": "To'annoon Hojjechaa Jira",
            "editBody": "Qaama Gulaali",
            "confirmAvatar": "Avataara Mirkaneessi",
            "walkTest": "Tarkaanfii Yaali",
            "spin360": "360° Naannessi",
            "biometrics": "Baayoomeetiriiksii",
            "height": "Dheerina",
            "structure": "Caasaa",
            "calibration": "Qindeeffama",
            "coutureMatch": "Walitti Dhufeenya Kuusaa"
        },
        "ai": {
            "concierge": "Gorsaa Tilet AI",
            "ask": "Tilet3D Gaafadhu",
            "openFull": "Walgahi full chat bani →",
            "welcome": "Akkam! Ani gorsaa Tilet3D AI ti. Har'a akkamitti isin gargaaruu danda'a?",
            "minimise": "Xiqqeessi",
            "prompt": {
                "tryOn": "Uffata yaaluun akkamitti hojjeta?",
                "outfit": "Uffata naaf filadhu",
                "whatsNew": "Kuusaa haaraa maaltu jira?"
            },
            "suggestions": {
                "kemis": "Dizaayinii Qamisii Habashaa kamtu beekamaadha?",
                "netela": "Netelaa irraa bifa akkamiitu jira?",
                "tryon": "Avataar 3D'n uffata yaaluun akkamitti hojjeta?"
            }
        },
        "settings": {
            "preferencesTitle": "Naannoo fi Filannoowwan",
            "preferencesDesc": "Gosa qarshii, afaan, fi beeksisa keessan sirreeffadhaa.",
            "currencyLabel": "Gosa Qarshii Filatame",
            "languageLabel": "Afaan Agarsiisaa",
            "notificationsTitle": "Filannoowwan Beeksisaa",
            "orderUpdates": "Odeeffannoo Ajajaa",
            "orderUpdatesDesc": "Haala dhiheessaa fi kaffaltiirratti iimeelii beeksisaa argadhaa.",
            "promotions": "Beeksisa fi Kuusaalee",
            "promotionsDesc": "Uffata haaraa fi gurgurtaa addaarratti yeroo yeroon odeeffannoo argadhaa.",
            "fittingRoomAlerts": "Beeksisa Iddoo Yaalii 3D",
            "fittingRoomAlertsDesc": "Avataarri ykn 3D mesh haaromfamuu yoo qabaate odeeffadhaa.",
            "saveChanges": "Jijjiirama Olkaayi",
            "saved": "Olkaayameera!",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "Gara korbootti dabaluuf mee seeni",
                "store": "Suuqii",
                "returnToCollection": "Gara kuusaatti deebi'i",
                "signIn": "Seeni",
                "createAccount": "Herrega Uumi",
                "verifyEmail": "Iimeelii Mirkaneessi",
                "sendRecoveryCode": "Koodii Birmannaa Ergi",
                "updatePassword": "Jecha Darbii Haaromsi"
            },
            "dashboard": {
                "interactive3d": "Walsimsiisa 3D Qabatamaa",
                "launchStudio": "Istuudiyoo 3D Bani",
                "browseCollection": "Kuusaa Barbaadi",
                "viewFullHistory": "Seenaa Guutuu Ilaali",
                "backToHome": "Gara Jalqabaatti Deebi'i"
            }
        },
        "admin": {
            "staffAuth": "Naannoo Hojjattootaa",
            "loadingDetails": "Bal'ina ajajaa fe'aa jira...",
            "refresh": "Haaromsuu",
            "event": "Taatee",
            "user": "Fayyadamaa",
            "ipAddress": "Teessoo IP",
            "userAgent": "Kilaayenti Yuuzar-Eejeentii",
            "timestamp": "Yeroo",
            "customer": "Maamila",
            "email": "Iimeelii",
            "orders": "Ajajawwan",
            "totalSpent": "Waliigala Baasii",
            "joined": "Kan Makame",
            "action": "Tarkaanfii",
            "category": "Gosa",
            "slug": "Slaagii",
            "assignedProducts": "Oomishaalee Ramadaman",
            "status": "Haala",
            "product": "Oomisha",
            "unitPrice": "Gatii Tokkoo",
            "physicalStock": "Qabeenya Kuusaa",
            "reserved": "Kan Qabame",
            "available": "Kan Jiru",
            "addProduct": "Oomisha Dabali",
            "allCategories": "Gosa Hunda",
            "allStatuses": "Haala Hunda",
            "activeOnly": "Hojjataa Qofa",
            "inactiveOnly": "Hojii Dhaabe Qofa",
            "pending": "Eegamaa",
            "confirmed": "Mirkanaa'e",
            "processing": "Adeemsarra Jira",
            "shipped": "Ergameera",
            "delivered": "Dhaqqabeera",
            "amount": "Hammamtaa",
            "orderNumber": "Lakk. Ajajaa",
            "gateway": "Geetweeyii",
            "revenue": "Galii",
            "unitsSold": "Gurgurame"
        }
    },
    "am": {
        "common": {
            "details": "ዝርዝር",
            "unisex": "ለሁለቱም ጾታ",
            "back": "ተመለስ",
            "loading": "በመጫን ላይ..."
        },
        "hero": {
            "gender": {
                "female": "ሴት",
                "male": "ወንድ"
            }
        },
        "howItWorks": {
            "badge": "እንዴት እንደሚሰራ",
            "titleLead": "ከልኬት ጀምሮ",
            "titleAccent": "እስከ ፍጹም ልክ ድረስ።",
            "subtitle": "ጥለት3D የባህላዊ የሀበሻ ልብስ ስፌትን ወደ ቀጥታ 3D ተሞክሮ ይቀይረዋል።",
            "stepLabel": "ደረጃ",
            "step1": {
                "title": "አቫታርዎን ይፍጠሩ",
                "desc": "ጥቂት ልኬቶችን ያስገቡ እና ጥለት3D ለእርስዎ ትክክለኛ የ3D ምስል ይፈጥራል።"
            },
            "step2": {
                "title": "የሀበሻ ልብሶችን ይሞክሩ",
                "desc": "በእጅ የተሰሩ ባህላዊ አልባሳትን በአቫታርዎ ላይ በቀጥታ ይመልከቱ። ያሽከርክሩ፣ ያቅርቡ እና ዝርዝሩን ይመልከቱ።"
            },
            "step3": {
                "title": "በሙሉ እምነት ይዘዙ",
                "desc": "የወደዱትን ዲዛይን ይምረጡ፤ ልብሱ ከመሰፋቱ በፊት እንዴት እንደሚስማማዎት አውቀው ይዘዙ።"
            }
        },
        "featured": {
            "atelier": "ጥለት3D አውደ ጥናት",
            "title": "ተመራጭ ስብስቦች",
            "tagline": "የትኛውን መረጡ?",
            "viewDetails": "ዝርዝሩን ይመልከቱ",
            "loadingMore": "ተጨማሪ በመጫን ላይ..."
        },
        "cultural": {
            "title": "የባህል ውርስ።",
            "wedding": "ሰርግ።",
            "oromo": "ኦሮሞ።",
            "tigray": "ትግራይ።",
            "amhara": "አማራ።",
            "weddingDesc": "የሰርግ ስብስብ",
            "oromoDesc": "የዘመናት ባህል ትውስታ። እያንዳንዱ ክር የትውልድ ታሪክን ከዘመናዊ ውበት ጋር ያዋህዳል።",
            "tigrayDesc": "ከታሪክ የፈለቀ። ደማቅ ጥልፍ እና ጥንቃቄ የተሞላበት የእጅ ስራ የዘመናት ቅርስን ያንጸባርቃል።",
            "amharaDesc": "ዘመን የማይሽረው ውበት። የኢትዮጵያን የጥበብ ጥበብ በእያንዳንዱ ስፌት ያከብራል።",
            "noProducts": "ምንም ምርት አልተገኘም ለ"
        },
        "products": {
            "tryOn": "አቫታር ይሞክሩ",
            "rent": "ይከራዩ",
            "bespoke": "ልዩ ትዕዛዝ",
            "backToCollection": "ወደ ስብስቡ ተመለስ",
            "addNote": "ስለ አልባሳቱ አስተያየት ይጻፉ...",
            "post": "ለጥፍ",
            "sortBy": "አደራደር",
            "sortNewest": "አዲስ የመጡ",
            "sortPriceAsc": "ዋጋ፡ ከዝቅተኛ → ከፍተኛ",
            "sortPriceDesc": "ዋጋ፡ ከከፍተኛ → ዝቅተኛ",
            "sortRelevance": "አግባብነት",
            "categoriesLabel": "ምድብ",
            "priceRange": "የዋጋ ክልል",
            "budgetPrice": "ተመጣጣኝ (<2ሺ)",
            "midPrice": "መካከለኛ",
            "premiumPrice": "ፕሪሚየም",
            "inStockOnly": "ክምችት ላይ ያለ ብቻ",
            "viewResults": "ውጤቶችን ይመልከቱ",
            "card": {
                "addToCart": "ወደ ቅርጫት አስገባ (ግዛ)",
                "addedToCart": "ወደ ቅርጫት ገብቷል",
                "front": "የፊት",
                "back": "የኋላ",
                "top": "የላይ",
                "view": "እይታ"
            }
        },
        "detail": {
            "notFound": "ይህ ምርት አልተገኘም።",
            "selectSizeFirst": "መጀመሪያ መጠን ወይም አይነት ይምረጡ"
        },
        "cart": {
            "addedToCart": "ወደ ቅርጫት ገብቷል"
        },
        "rentals": {
            "title": "ኪራዮች",
            "noRentals": "እስካሁን ምንም ኪራይ የለም",
            "browseRentals": "የሚከራዩ አልባሳትን ያስሱ",
            "durationOptions": "የኪራይ ቆይታ አማራጮች",
            "fixedPackage": "የተወሰነ ጥቅል",
            "customDates": "ብጁ ቀናት",
            "daysAccess": "ቀናት ሙሉ አገልግሎት",
            "available": "ልብሱ ይገኛል",
            "pickupTitle": "ከአውደ ጥናት መረከብ እና መመለስ",
            "pickupSubtitle": "ነጻ · ቦሌ መድኃኔዓለም",
            "deliveryTitle": "በመልእክተኛ ማድረስ",
            "deliveryFee": "እስከ በር ድረስ ማድረስ እና መመለስ",
            "duration": "የኪራይ ቆይታ",
            "agreement": "የጥለት3D የኪራይ እና የባህል አልባሳት እንክብካቤ ደንብን እስማማለሁ። ከተመረመረ በኋላ ማስያዣው ይመለሳል።",
            "agreePrompt": "ለመቀጠል እባክዎን የባህል አልባሳት እንክብካቤ ደንብን ይቀበሉ።",
            "reserveBtn": "አረጋግጥ እና በቻፓ ክፈል",
            "unavailableTitle": "ኪራይ ለጊዜው አይገኝም",
            "unavailableDesc": "ይህ ባህላዊ ልብስ ለጊዜው ለኪራይ አይገኝም። በቀጥታ መግዛት ይችላሉ።",
            "periodLabel": "የኪራይ ጊዜ፡",
            "statusLabel": "ወቅታዊ ሁኔታ፡",
            "fulfillmentLabel": "የማድረሻ ዘዴ፡",
            "addressLabel": "የማድረሻ አድራሻ፡",
            "subtotalLabel": "የኪራይ ድምር፡",
            "depositLabel": "የዋስትና ማስያዣ፡",
            "deliveryFeeLabel": "የማድረሻ ክፍያ፡",
            "totalLabel": "አጠቃላይ ክፍያ፡"
        },
        "checkout": {
            "tax": "ታክስ (15% ተ.እ.ታ)",
            "shippingFee": "ማጓጓዣ",
            "totalDue": "ጠቅላላ ክፍያ",
            "region": "ክልል",
            "subCity": "ክፍለ ከተማ",
            "woreda": "ወረዳ",
            "houseNo": "የቤት ቁጥር",
            "deliveryNote": "የማድረሻ ማስታወሻ (አማራጭ)",
            "chapaSecure": "🔒 አስተማማኝ በቻፓ የተጠበቀ ክፍያ። የኢትዮጵያ ብር (ETB)።",
            "addressRequired": "ለመልእክተኛ ማድረሻ አድራሻ ያስፈልጋል።",
            "secureEncryption": "ደህንነቱ የተጠበቀ ምስጠራ",
            "orderNumber": "የትዕዛዝ ቁጥር",
            "paymentStatus": "የክፍያ ሁኔታ",
            "paymentProvider": "የክፍያ አቅራቢ",
            "transactionId": "የግብይት መለያ",
            "orderNote": "የትዕዛዝ ማስታወሻ",
            "itemDescription": "የእቃው ዝርዝር",
            "price": "ዋጋ",
            "total": "ድምር",
            "itemsOrdered": "የታዘዙ እቃዎች",
            "customerNote": "የደንበኛ ማስታወሻ",
            "summary": "ማጠቃለያ",
            "subtotal": "ንዑስ ድምር",
            "discount": "ቅናሽ",
            "goBack": "ወደ ኋላ ተመለስ",
            "continueShopping": "ግዢዎን ይቀጥሉ"
        },
        "avatar": {
            "nickname": "ቅጽል ስም",
            "age": "እድሜ",
            "bodyType": "የሰውነት ቅርጽ",
            "shoulder": "ትከሻ",
            "weight": "ክብደት",
            "controls": "የስቱዲዮ መቆጣጠሪያዎች",
            "controlsActive": "መቆጣጠሪያዎች ነቅተዋል",
            "editBody": "ሰውነትን አስተካክል",
            "confirmAvatar": "አቫታርን አረጋግጥ",
            "walkTest": "የእርምጃ ሙከራ",
            "spin360": "360° አሽከርክር",
            "biometrics": "ባዮሜትሪክስ",
            "height": "ቁመት",
            "structure": "መዋቅር",
            "calibration": "ማስተካከያ",
            "coutureMatch": "የአልባሳት ተዛምዶ"
        },
        "ai": {
            "concierge": "የጥለት AI አማካሪ",
            "ask": "ጥለት3Dን ይጠይቁ",
            "openFull": "ሙሉ ውይይት ክፈት →",
            "welcome": "ሰላም! እኔ የጥለት3D AI አማካሪ ነኝ። ዛሬ እንዴት ልርዳዎት?",
            "minimise": "አሳንስ",
            "prompt": {
                "tryOn": "የአቫታር ሙከራ እንዴት ይሰራል?",
                "outfit": "ልብስ እንድመርጥ እርዳኝ",
                "whatsNew": "አዲስ ምን ስብስብ አለ?"
            },
            "suggestions": {
                "kemis": "የትኞቹ የሀበሻ ቀሚስ ዲዛይኖች ተወዳጅ ናቸው?",
                "netela": "ከነጠላ ምን አይነት ቀለሞች አሉ?",
                "tryon": "የ3D አቫታር ሙከራ እንዴት ይሰራል?"
            }
        },
        "settings": {
            "preferencesTitle": "ክልላዊ እና ምርጫዎች",
            "preferencesDesc": "የገንዘብ አይነት፣ ቋንቋ እና የማሳወቂያ ምርጫዎችን ያብጁ።",
            "currencyLabel": "ተመራጭ የገንዘብ አይነት",
            "languageLabel": "የማሳያ ቋንቋ",
            "notificationsTitle": "የማሳወቂያ ምርጫዎች",
            "orderUpdates": "የትዕዛዝ መረጃዎች",
            "orderUpdatesDesc": "ስለ ማድረሻ እና ክፍያ በኢሜይል ማሳወቂያዎችን ያግኙ።",
            "promotions": "ማስተዋወቂያዎች እና ስብስቦች",
            "promotionsDesc": "ስለ አዳዲስ ዲዛይኖች እና ቅናሾች ወቅታዊ መረጃዎችን ያግኙ።",
            "fittingRoomAlerts": "የ3D መሞከሪያ ማሳወቂያዎች",
            "fittingRoomAlertsDesc": "አቫታር ወይም የ3D ሞዴል ሲሻሻል ማሳወቂያ ያግኙ።",
            "saveChanges": "ለውጦችን አስቀምጥ",
            "saved": "ተቀምጧል!",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "ወደ ቅርጫት ለማስገባት እባክዎ ይግቡ",
                "store": "ሱቅ",
                "returnToCollection": "ወደ ስብስቡ ተመለስ",
                "signIn": "ይግቡ",
                "createAccount": "መለያ ይፍጠሩ",
                "verifyEmail": "ኢሜይል ያረጋግጡ",
                "sendRecoveryCode": "የማገገሚያ ኮድ ላክ",
                "updatePassword": "የይለፍ ቃል አድስ"
            },
            "dashboard": {
                "interactive3d": "ቀጥታ የ3D ልክ",
                "launchStudio": "የ3D ስቱዲዮ ክፈት",
                "browseCollection": "ስብስቦችን ያስሱ",
                "viewFullHistory": "ሙሉ ታሪክ ይመልከቱ",
                "backToHome": "ወደ መነሻ ተመለስ"
            }
        },
        "admin": {
            "staffAuth": "የሰራተኞች አካባቢ",
            "loadingDetails": "የትዕዛዝ ዝርዝሮችን በመጫን ላይ...",
            "refresh": "አድስ",
            "event": "ክስተት",
            "user": "ተጠቃሚ",
            "ipAddress": "የአይፒ አድራሻ",
            "userAgent": "የደንበኛ መሣሪያ",
            "timestamp": "ጊዜ",
            "customer": "ደንበኛ",
            "email": "ኢሜይል",
            "orders": "ትዕዛዞች",
            "totalSpent": "ጠቅላላ ወጪ",
            "joined": "የተቀላቀለበት",
            "action": "እርምጃ",
            "category": "ምድብ",
            "slug": "ስላግ",
            "assignedProducts": "የተመደቡ ምርቶች",
            "status": "ሁኔታ",
            "product": "ምርት",
            "unitPrice": "የአንዱ ዋጋ",
            "physicalStock": "የመጋዘን ክምችት",
            "reserved": "የተያዘ",
            "available": "ያለ",
            "addProduct": "ምርት አክል",
            "allCategories": "ሁሉም ምድቦች",
            "allStatuses": "ሁሉም ሁኔታዎች",
            "activeOnly": "ንቁ ብቻ",
            "inactiveOnly": "ቦዘኔ ብቻ",
            "pending": "በመጠባበቅ ላይ",
            "confirmed": "የተረጋገጠ",
            "processing": "በሂደት ላይ",
            "shipped": "የተላከ",
            "delivered": "የደረሰ",
            "amount": "መጠን",
            "orderNumber": "የትዕዛዝ ቁጥር",
            "gateway": "መተላለፊያ",
            "revenue": "ገቢ",
            "unitsSold": "የተሸጠ ብዛት"
        }
    },
    "ti": {
        "common": {
            "details": "ዝርዝር",
            "unisex": "ንኽልቲኡ ጾታ",
            "back": "ተመለስ",
            "loading": "ይጽዕን ኣሎ..."
        },
        "hero": {
            "gender": {
                "female": "ጓል ኣንስተይቲ",
                "male": "ወዲ ተባዕታይ"
            }
        },
        "howItWorks": {
            "badge": "ከመይ ይሰርሕ",
            "titleLead": "ካብ ዓቐን ጀሚርካ",
            "titleAccent": "ክሳብ ትኽክለኛ ልክዕ።",
            "subtitle": "ጥለት3D ባህላዊ ስፌት ሓበሻ ናብ ቀሊል ናይ 3D ተሞክሮ ይቕይሮ።",
            "stepLabel": "ደረጃ",
            "step1": {
                "title": "ኣቫታርካ ፍጠር",
                "desc": "ውሑዳት ዓቐናት ኣእቱ፤ ጥለት3D ትኽክለኛ ናይ 3D ምስልኻ ይፈጥረልካ።"
            },
            "step2": {
                "title": "ክዳውንቲ ሓበሻ ፈትን",
                "desc": "ብኢድ ዝተሰርሑ ባህላዊ ክዳውንቲ ኣብ ኣቫታርካ ብቐጥታ ርአ። ኣዞሮ፣ ኣዕብዮ እሞ ዝርዝሩ ተዓዘብ።"
            },
            "step3": {
                "title": "ብሙሉእ ምትእምማን እዘዝ",
                "desc": "ዝፈተኽዮ ዲዛይን ምረጽ፤ ከይተሰፈወ ከመይ ከም ዝሰማምዓካ ፈሊጥካ እዘዝ።"
            }
        },
        "featured": {
            "atelier": "ጥለት3D ስቱድዮ",
            "title": "ዝተመርጹ ስብስባት",
            "tagline": "ኣየናይ መሪጽኩም?",
            "viewDetails": "ዝርዝር ርአ",
            "loadingMore": "ተወሳኺ ይጽዕን ኣሎ..."
        },
        "cultural": {
            "title": "ባህላዊ ውርሻ።",
            "wedding": "መርዓ።",
            "oromo": "ኦሮሞ።",
            "tigray": "ትግራይ።",
            "amhara": "ኣምሓራ።",
            "weddingDesc": "ስብስብ መርዓ",
            "oromoDesc": "ናይ ዘመናት ባህሊ። ነፍሲ ወከፍ ፈትሊ ታሪኽ ወለዶ ምስ ዘመናዊ ጽባቐ የዋህድ።",
            "tigrayDesc": "ካብ ታሪኽ ዝመንጨወ። ደማቕ ጥልፍን ጥንቁቕ ናይ ኢድ ስራሕን ባህላዊ ቅርስታት የንጸባርቕ።",
            "amharaDesc": "ዘይሃስስ ጽባቐ። ጥበብ ኢትዮጵያ ኣብ ነፍሲ ወከፍ ስፌት የኽብር።",
            "noProducts": "ዝተረኽበ ፍርያት የለን ን"
        },
        "products": {
            "tryOn": "ኣቫታር ፈትን",
            "rent": "ተኻረይ",
            "bespoke": "ፍሉይ ትእዛዝ",
            "backToCollection": "ናብ ስብስብ ተመለስ",
            "addNote": "ኣስተያየት ጽሓፍ...",
            "post": "ልኣኽ",
            "sortBy": "ኣሰላልፋ",
            "sortNewest": "ሓደስቲ ዝመጹ",
            "sortPriceAsc": "ዋጋ፡ ካብ ትሑት → ላዕሊ",
            "sortPriceDesc": "ዋጋ፡ ካብ ላዕሊ → ትሑት",
            "sortRelevance": "ተዛማድነት",
            "categoriesLabel": "ዓይነት",
            "priceRange": "መጠንን ዋጋ",
            "budgetPrice": "ተመጣጣኒ (<2ሽሕ)",
            "midPrice": "ማእከላይ",
            "premiumPrice": "ሉክሱሪ",
            "inStockOnly": "ኣብ መኽዘን ዘሎ ጥራይ",
            "viewResults": "ውጽኢት ርአ",
            "card": {
                "addToCart": "ናብ ቅርጫት ኣእቱ (ዓድግ)",
                "addedToCart": "ናብ ቅርጫት ኣትዩ",
                "front": "ቅድሚት",
                "back": "ድሕሪት",
                "top": "ላዕሊ",
                "view": "ርአ"
            }
        },
        "detail": {
            "notFound": "እዚ ፍርያት ኣይተረኽበን።",
            "selectSizeFirst": "ቅድም ዓቐን ወይ ዓይነት ምረጽ"
        },
        "cart": {
            "addedToCart": "ናብ ቅርጫት ኣትዩ"
        },
        "rentals": {
            "title": "ክራይታት",
            "noRentals": "ክሳብ ሕጂ ክራይ የለን",
            "browseRentals": "ዝካረዩ ክዳውንቲ ርአ",
            "durationOptions": "ናይ ክራይ ግዜ ኣማራጺታት",
            "fixedPackage": "ውሱን ጥቅል",
            "customDates": "ዝተወሰኑ መዓልታት",
            "daysAccess": "መዓልታት ምሉእ ኣገልግሎት",
            "available": "ክዳን ኣሎ",
            "pickupTitle": "ካብ ስቱድዮ ምውሳድን ምምላስን",
            "pickupSubtitle": "ብነጻ · ቦሌ መድኃኔዓለም",
            "deliveryTitle": "ብመልእኽተኛ ምብጻሕ",
            "deliveryFee": "ክሳብ በሪ ምብጻሕን ምምላስን",
            "duration": "ናይ ክራይ ጻንሒት",
            "agreement": "ናይ ጥለት3D ክራይን ባህላዊ ክዳውንቲ ምክንኻንን ደንቢ እስማማዕ። ምስ ተመርመረ መትሓዚ ይምለስ።",
            "agreePrompt": "ንቕድሚት ንምስጓም ሕጊ ክንክን ባህላዊ ክዳውንቲ ተቐበሉ።",
            "reserveBtn": "ኣረጋግጽን ብቻፓ ክፈልን",
            "unavailableTitle": "ክራይ ንግዚኡ የለን",
            "unavailableDesc": "እዚ ባህላዊ ክዳን ንግዚኡ ንክራይ ኣይቐረበን። ብቐጥታ ክትዕድጉ ትኽእሉ ኢኹም።",
            "periodLabel": "ናይ ክራይ ግዜ፡",
            "statusLabel": "ህሉው ኩነታት፡",
            "fulfillmentLabel": "ናይ ምብጻሕ ሜላ፡",
            "addressLabel": "ናይ ምብጻሕ ኣድራሻ፡",
            "subtotalLabel": "ናይ ክራይ ድምር፡",
            "depositLabel": "ናይ ውሕስነት መትሓዚ፡",
            "deliveryFeeLabel": "ናይ ምብጻሕ ክፍሊት፡",
            "totalLabel": "ጠቕላላ ክፍሊት፡"
        },
        "checkout": {
            "tax": "ታክስ (15% ተወሳኺ እሴት)",
            "shippingFee": "መጓዓዝያ",
            "totalDue": "ጠቕላላ ዝኽፈል",
            "region": "ዞባ",
            "subCity": "ክፍለ ከተማ",
            "woreda": "ወረዳ",
            "houseNo": "ቑጽሪ ገዛ",
            "deliveryNote": "መዘክር ምብጻሕ (ኣማራጺ)",
            "chapaSecure": "🔒 ብቻፓ ዝተሓለወ ውሑስ ክፍሊት። ናይ ኢትዮጵያ ቅርሺ (ETB)።",
            "addressRequired": "ንመልእኽተኛ ኣድራሻ የድሊ።",
            "secureEncryption": "ውሑስ ምስጥራዊ ሓበሬታ",
            "orderNumber": "ቑጽሪ ትእዛዝ",
            "paymentStatus": "ኩነታት ክፍሊት",
            "paymentProvider": "መቕረቢ ክፍሊት",
            "transactionId": "መለለዪ ግብይት",
            "orderNote": "መዘክር ትእዛዝ",
            "itemDescription": "ዝርዝር ኣቑሑት",
            "price": "ዋጋ",
            "total": "ድምር",
            "itemsOrdered": "ዝተኣዘዙ ኣቑሑት",
            "customerNote": "መዘክር ዓሚል",
            "summary": "ጽሟቕ",
            "subtotal": "ንኡስ ድምር",
            "discount": "ቅናሽ",
            "goBack": "ንድሕሪት ተመለስ",
            "continueShopping": "ዕዳጋኻ ቐጽል"
        },
        "avatar": {
            "nickname": "ቅጽል ስም",
            "age": "ዕድመ",
            "bodyType": "ቅርጺ ሰብነት",
            "shoulder": "መንከብ",
            "weight": "ክብደት",
            "controls": "መቆጻጸሪታት ስቱድዮ",
            "controlsActive": "መቆጻጸሪታት ነቒሖም",
            "editBody": "ሰብነት ኣስተኻኽል",
            "confirmAvatar": "ኣቫታር ኣረጋግጽ",
            "walkTest": "ፈተነ ስጉምቲ",
            "spin360": "360° ኣዞር",
            "biometrics": "ባዮሜትሪክስ",
            "height": "ቁመት",
            "structure": "መዋቕር",
            "calibration": "ምዕራይ",
            "coutureMatch": "ምስምማዕ ክዳውንቲ"
        },
        "ai": {
            "concierge": "ናይ ጥለት AI ኣማኻሪ",
            "ask": "ንጥለት3D ሕተት",
            "openFull": "ምሉእ ዕላል ክፈት →",
            "welcome": "ሰላም! ኣነ ናይ ጥለት3D AI ኣማኻሪ እየ። ሎሚ ብኸመይ ክሕግዘኩም?",
            "minimise": "ኣንእስ",
            "prompt": {
                "tryOn": "ምፍታን ኣቫታር ከመይ ይሰርሕ?",
                "outfit": "ክዳን ክመርጽ ሓግዘኒ",
                "whatsNew": "ሓድሽ እንታይ ስብስብ ኣሎ?"
            },
            "suggestions": {
                "kemis": "ኣየኖት ናይ ሓበሻ ቀሚስ ዲዛይናት ፍቱዋት እዮም?",
                "netela": "ካብ ነጸላ እንታይ ሕብርታት ኣሎ?",
                "tryon": "ናይ 3D ኣቫታር ፈተነ ከመይ ይሰርሕ?"
            }
        },
        "settings": {
            "preferencesTitle": "ዞባውን ምርጫታትን",
            "preferencesDesc": "ዓይነት ገንዘብ፣ ቋንቋን መተሓሳሰቢታትን ኣዐሪ።",
            "currencyLabel": "ዝተመርጸ ዓይነት ገንዘብ",
            "languageLabel": "መገጽ ቋንቋ",
            "notificationsTitle": "ምርጫታት መተሓሳሰቢ",
            "orderUpdates": "ሓበሬታ ትእዛዝ",
            "orderUpdatesDesc": "ብዛዕባ ምብጻሕን ክፍሊትን ብኢመይል ሓበሬታ ርኸቡ።",
            "promotions": "ምልላይን ስብስባትን",
            "promotionsDesc": "ብዛዕባ ሓደስቲ ዲዛይናትን ቅናሻትን ሓበሬታ ርኸቡ።",
            "fittingRoomAlerts": "መተሓሳሰቢ ክፍሊ ፈተነ 3D",
            "fittingRoomAlertsDesc": "ኣቫታር ወይ 3D ሞዴል ክመሓየሽ ከሎ ሓበሬታ ርኸቡ።",
            "saveChanges": "ለውጥታት ኣቐምጥ",
            "saved": "ተቐሚጡ!",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "ናብ ቅርጫት ንምእታው በጃኹም እተዉ",
                "store": "ድኳን",
                "returnToCollection": "ናብ ስብስብ ተመለስ",
                "signIn": "እቶ",
                "createAccount": "ኣካውንት ፍጠር",
                "verifyEmail": "ኢመይል ኣረጋግጽ",
                "sendRecoveryCode": "ኮድ መሕወዪ ልኣኽ",
                "updatePassword": "መሕለፊ ቓል ሓድሽ"
            },
            "dashboard": {
                "interactive3d": "ቀጥታዊ 3D ልክዕ",
                "launchStudio": "ስቱድዮ 3D ጀምር",
                "browseCollection": "ስብስባት ርአ",
                "viewFullHistory": "ምሉእ ታሪኽ ርአ",
                "backToHome": "ናብ መበገሲ ተመለስ"
            }
        },
        "admin": {
            "staffAuth": "ናይ ሰራሕተኛታት ከባቢ",
            "loadingDetails": "ዝርዝር ትእዛዝ ይጽዕን ኣሎ...",
            "refresh": "ኣሐድስ",
            "event": "ፍጻመ",
            "user": "ተጠቃሚ",
            "ipAddress": "ኣድራሻ IP",
            "userAgent": "መሳርሒ ዓሚል",
            "timestamp": "ግዜ",
            "customer": "ዓሚል",
            "email": "ኢመይል",
            "orders": "ትእዛዛት",
            "totalSpent": "ጠቕላላ ወጻኢ",
            "joined": "ዝተጸምበረሉ",
            "action": "ስጉምቲ",
            "category": "ዓይነት",
            "slug": "ስላግ",
            "assignedProducts": "ዝተመደቡ ፍርያት",
            "status": "ኩነታት",
            "product": "ፍርያት",
            "unitPrice": "ዋጋ ሓደ",
            "physicalStock": "መኽዘን",
            "reserved": "ዝተታሕዘ",
            "available": "ዘሎ",
            "addProduct": "ፍርያት ወስኽ",
            "allCategories": "ኩሎም ዓይነታት",
            "allStatuses": "ኩሎም ኩነታት",
            "activeOnly": "ንጡፍ ጥራይ",
            "inactiveOnly": "ዘይንጡፍ ጥራይ",
            "pending": "ይጽበ ኣሎ",
            "confirmed": "ዝተረጋገጸ",
            "processing": "ኣብ መስርሕ",
            "shipped": "ዝተላእከ",
            "delivered": "ዝበጽሐ",
            "amount": "መጠንን",
            "orderNumber": "ቑጽሪ ትእዛዝ",
            "gateway": "መተሓላለፊ",
            "revenue": "ኣታዊ",
            "unitsSold": "ዝተሸጠ ብዝሒ"
        }
    },
    "fr": {
        "common": {
            "details": "Détails",
            "unisex": "Unisexe",
            "back": "Retour",
            "loading": "Chargement..."
        },
        "hero": {
            "gender": {
                "female": "Femme",
                "male": "Homme"
            }
        },
        "howItWorks": {
            "badge": "Comment ça marche",
            "titleLead": "De la prise de mesure",
            "titleAccent": "à la coupe parfaite.",
            "subtitle": "Tilet3D transforme la confection traditionnelle habesha en une expérience 3D fluide et instantanée.",
            "stepLabel": "ÉTAPE",
            "step1": {
                "title": "Créez votre avatar",
                "desc": "Entrez quelques mensurations et Tilet3D génère un modèle 3D réaliste pour un essayage virtuel ultra-précis."
            },
            "step2": {
                "title": "Essayez la haute couture habesha",
                "desc": "Visualisez les créations tissées main sur votre avatar en direct. Pivotez, zoomez et inspectez chaque tissage."
            },
            "step3": {
                "title": "Commandez en toute sérénité",
                "desc": "Choisissez votre modèle favori en sachant exactement comment il vous ira avant même le premier point de couture."
            }
        },
        "featured": {
            "atelier": "ATELIER TILET3D",
            "title": "Collection à la Une",
            "tagline": "Laquelle vous inspire ?",
            "viewDetails": "Voir les Détails",
            "loadingMore": "Chargement supplémentaire..."
        },
        "cultural": {
            "title": "Héritage Culturel.",
            "wedding": "Mariage.",
            "oromo": "Oromo.",
            "tigray": "Tigray.",
            "amhara": "Amhara.",
            "weddingDesc": "Collection Mariage",
            "oromoDesc": "Une tapisserie de traditions. Chaque fil tisse l'histoire des générations passées au cœur de l'élégance contemporaine.",
            "tigrayDesc": "Ancré dans l'histoire. Des motifs chatoyants et un artisanat minutieux reflétant des siècles de culture.",
            "amharaDesc": "Grâce intemporelle. Célébrant la beauté singulière et l'âme de l'art éthiopien à chaque couture.",
            "noProducts": "Aucun produit trouvé pour"
        },
        "products": {
            "tryOn": "Essayer sur Avatar",
            "rent": "Louer",
            "bespoke": "Sur Mesure",
            "backToCollection": "Retour à la collection",
            "addNote": "Ajouter une note sur la tenue...",
            "post": "Publier",
            "sortBy": "Trier par",
            "sortNewest": "Nouveautés",
            "sortPriceAsc": "Prix : Croissant",
            "sortPriceDesc": "Prix : Décroissant",
            "sortRelevance": "Pertinence",
            "categoriesLabel": "Catégorie",
            "priceRange": "Gamme de Prix",
            "budgetPrice": "Accessible (<2K)",
            "midPrice": "Moyenne gamme",
            "premiumPrice": "Prestige",
            "inStockOnly": "En stock uniquement",
            "viewResults": "Voir les Résultats",
            "card": {
                "addToCart": "Ajouter au Panier (Achat)",
                "addedToCart": "Ajouté au Panier",
                "front": "Face",
                "back": "Dos",
                "top": "Haut",
                "view": "Vue"
            }
        },
        "detail": {
            "notFound": "Ce produit est introuvable.",
            "selectSizeFirst": "Veuillez d'abord sélectionner une taille ou variante"
        },
        "cart": {
            "addedToCart": "Ajouté au panier"
        },
        "rentals": {
            "title": "Locations",
            "noRentals": "Aucune location pour le moment",
            "browseRentals": "Parcourir les pièces à louer",
            "durationOptions": "Options de Durée de Location",
            "fixedPackage": "Forfait Fixe",
            "customDates": "Dates Personnalisées",
            "daysAccess": "Jours d'Accès Complet",
            "available": "Pièce Disponible",
            "pickupTitle": "Retrait & Retour en Atelier",
            "pickupSubtitle": "Gratuit · Bole Medhanialem",
            "deliveryTitle": "Livraison par Coursier",
            "deliveryFee": "Livraison & Reprise à Domicile",
            "duration": "Durée de Location",
            "agreement": "J'accepte la politique de location et d'entretien des étoffes traditionnelles Tilet3D. La caution est remboursée après contrôle d'atelier.",
            "agreePrompt": "Veuillez accepter la politique d'entretien pour continuer.",
            "reserveBtn": "Confirmer & Payer via Chapa",
            "unavailableTitle": "Location Indisponible",
            "unavailableDesc": "Cette pièce artisanale n'est pas disponible à la location actuellement. Vous pouvez l'acheter directement.",
            "periodLabel": "Période de Location :",
            "statusLabel": "Statut Actuel :",
            "fulfillmentLabel": "Mode de Remise :",
            "addressLabel": "Adresse de Livraison :",
            "subtotalLabel": "Sous-total Location :",
            "depositLabel": "Dépôt de Garantie :",
            "deliveryFeeLabel": "Frais de Livraison :",
            "totalLabel": "Montant Total :"
        },
        "checkout": {
            "tax": "TVA (15%)",
            "shippingFee": "Livraison",
            "totalDue": "Total à Régler",
            "region": "Région",
            "subCity": "Arrondissement",
            "woreda": "Woreda",
            "houseNo": "N° de Porte",
            "deliveryNote": "Instructions de livraison (Optionnel)",
            "chapaSecure": "🔒 Paiement 256-bit hautement sécurisé par Chapa. En Birr éthiopien (ETB).",
            "addressRequired": "L'adresse est requise pour la livraison par coursier.",
            "secureEncryption": "Chiffrement Sécurisé",
            "orderNumber": "N° de Commande",
            "paymentStatus": "Statut du Paiement",
            "paymentProvider": "Fournisseur de Paiement",
            "transactionId": "ID de Transaction",
            "orderNote": "Note de Commande",
            "itemDescription": "Description de l'Article",
            "price": "Prix",
            "total": "Total",
            "itemsOrdered": "Articles Commandés",
            "customerNote": "Note Client",
            "summary": "Récapitulatif",
            "subtotal": "Sous-total",
            "discount": "Remise",
            "goBack": "Retourner",
            "continueShopping": "Continuer vos Achats"
        },
        "avatar": {
            "nickname": "Pseudo",
            "age": "Âge",
            "bodyType": "Morphologie",
            "shoulder": "Épaules",
            "weight": "Poids",
            "controls": "Commandes Atelier",
            "controlsActive": "Commandes Actives",
            "editBody": "Modifier Silhouette",
            "confirmAvatar": "Valider l'Avatar",
            "walkTest": "Test de Marche",
            "spin360": "Rotation 360°",
            "biometrics": "Biométrie",
            "height": "Taille",
            "structure": "Structure",
            "calibration": "Étalonnage",
            "coutureMatch": "Ajustement Couture"
        },
        "ai": {
            "concierge": "Concierge Tilet AI",
            "ask": "Demander à Tilet3D",
            "openFull": "Ouvrir le chat complet →",
            "welcome": "Bonjour ! Je suis votre Concierge IA Tilet3D. Comment puis-je vous accompagner aujourd'hui ?",
            "minimise": "Réduire",
            "prompt": {
                "tryOn": "Comment fonctionne l'essayage 3D ?",
                "outfit": "Aidez-moi à choisir une tenue",
                "whatsNew": "Quelles sont les nouveautés ?"
            },
            "suggestions": {
                "kemis": "Quels sont les modèles de Habesha Kemis tendance ?",
                "netela": "Quels coloris sont disponibles pour le Netela ?",
                "tryon": "Comment fonctionne l'avatar 3D ?"
            }
        },
        "settings": {
            "preferencesTitle": "Région & Préférences",
            "preferencesDesc": "Personnalisez votre devise, votre langue et vos notifications.",
            "currencyLabel": "Devise Préférée",
            "languageLabel": "Langue d'Affichage",
            "notificationsTitle": "Préférences de Notification",
            "orderUpdates": "Suivi des Commandes",
            "orderUpdatesDesc": "Recevez des alertes e-mail sur l'expédition et le paiement.",
            "promotions": "Collections & Promotions",
            "promotionsDesc": "Restez informé des nouvelles créations et des ventes privées.",
            "fittingRoomAlerts": "Alertes Cabine 3D",
            "fittingRoomAlertsDesc": "Soyez averti des mises à jour de votre silhouette 3D.",
            "saveChanges": "Enregistrer les Modifications",
            "saved": "Enregistré !",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "Veuillez vous connecter pour ajouter au panier",
                "store": "Boutique",
                "returnToCollection": "Retour à la collection",
                "signIn": "Se connecter",
                "createAccount": "Créer un compte",
                "verifyEmail": "Vérifier l'e-mail",
                "sendRecoveryCode": "Envoyer le code",
                "updatePassword": "Mettre à jour le mot de passe"
            },
            "dashboard": {
                "interactive3d": "Essayage 3D Interactif",
                "launchStudio": "Lancer le Studio 3D",
                "browseCollection": "Parcourir la Collection",
                "viewFullHistory": "Historique Complet",
                "backToHome": "Retour à l'Accueil"
            }
        },
        "admin": {
            "staffAuth": "Espace Administration",
            "loadingDetails": "Chargement des détails...",
            "refresh": "Actualiser",
            "event": "Événement",
            "user": "Utilisateur",
            "ipAddress": "Adresse IP",
            "userAgent": "Agent Client",
            "timestamp": "Horodatage",
            "customer": "Client",
            "email": "E-mail",
            "orders": "Commandes",
            "totalSpent": "Total Dépensé",
            "joined": "Inscrit le",
            "action": "Action",
            "category": "Catégorie",
            "slug": "Slug",
            "assignedProducts": "Produits Liés",
            "status": "Statut",
            "product": "Produit",
            "unitPrice": "Prix Unitaire",
            "physicalStock": "Stock Physique",
            "reserved": "Réservé",
            "available": "Disponible",
            "addProduct": "Ajouter un Produit",
            "allCategories": "Toutes les Catégories",
            "allStatuses": "Tous les Statuts",
            "activeOnly": "Actifs uniquement",
            "inactiveOnly": "Inactifs uniquement",
            "pending": "En attente",
            "confirmed": "Confirmé",
            "processing": "En traitement",
            "shipped": "Expédié",
            "delivered": "Livré",
            "amount": "Montant",
            "orderNumber": "N° de Commande",
            "gateway": "Passerelle",
            "revenue": "Revenu",
            "unitsSold": "Unités Vendues"
        }
    },
    "ar": {
        "common": {
            "details": "التفاصيل",
            "unisex": "للجنسين",
            "back": "رجوع",
            "loading": "جار التحميل..."
        },
        "hero": {
            "gender": {
                "female": "أنثى",
                "male": "ذكر"
            }
        },
        "howItWorks": {
            "badge": "كيف يعمل",
            "titleLead": "من أخذ المقاسات",
            "titleAccent": "إلى المقاس المثالي.",
            "subtitle": "يحوّل تيلت ثري دي حياكة الأزياء الحبشية التقليدية إلى تجربة ثلاثية الأبعاد فورية وسلسة.",
            "stepLabel": "الخطوة",
            "step1": {
                "title": "أنشئ صورتك الرمزية",
                "desc": "أدخل بعض القياسات وسينشئ تيلت ثري دي نموذجاً واقعياً ثلاثي الأبعاد لتجربة قياس دقيقة."
            },
            "step2": {
                "title": "جرّب الأزياء الحبشية الفاخرة",
                "desc": "شاهد الأزياء المنسوجة يدوياً مباشرة على صورتك الرمزية. قم بالتدوير والتكبير وفحص كل خيط."
            },
            "step3": {
                "title": "اطلب بكل ثقة",
                "desc": "اختر التصميم الذي يعجبك واطلب وأنت على دراية تامة بكيفية ملاءمته لجسمك قبل بدء الخياطة."
            }
        },
        "featured": {
            "atelier": "أتيليه تيلت ثري دي",
            "title": "المجموعة المميزة",
            "tagline": "أي منها يناسب ذوقك؟",
            "viewDetails": "عرض التفاصيل",
            "loadingMore": "جار تحميل المزيد..."
        },
        "cultural": {
            "title": "التراث الثقافي.",
            "wedding": "الزفاف.",
            "oromo": "أورومو.",
            "tigray": "تيغراي.",
            "amhara": "أمهرا.",
            "weddingDesc": "مجموعة الزفاف",
            "oromoDesc": "نسيج من الأصالة. كل خيط يروي قصة أجيال نُسجت في روح الأناقة العصرية.",
            "tigrayDesc": "متجذر في التاريخ. أنماط زاهية وحرفية يدوية دقيقة تعكس قروناً من التراث العريق.",
            "amharaDesc": "جمال يتحدى الزمن. يحتفي بالفن الإثيوبي الأصيل في كل غرزة خياطة.",
            "noProducts": "لم يتم العثور على منتجات لـ"
        },
        "products": {
            "tryOn": "تجربة على الأفاتار",
            "rent": "استئجار",
            "bespoke": "طلب خاص مخصص",
            "backToCollection": "العودة إلى التشكيلة",
            "addNote": "أضف ملاحظة على التصميم...",
            "post": "نشر",
            "sortBy": "ترتيب حسب",
            "sortNewest": "أحدث الواصلين",
            "sortPriceAsc": "السعر: من الأقل إلى الأعلى",
            "sortPriceDesc": "السعر: من الأعلى إلى الأقل",
            "sortRelevance": "الأكثر ملائمة",
            "categoriesLabel": "التصنيف",
            "priceRange": "نطاق السعر",
            "budgetPrice": "اقتصادي (<2 ألف)",
            "midPrice": "متوسط",
            "premiumPrice": "فاخر",
            "inStockOnly": "المتوفر في المخزن فقط",
            "viewResults": "عرض النتائج",
            "card": {
                "addToCart": "إضافة إلى السلة (شراء)",
                "addedToCart": "تمت الإضافة إلى السلة",
                "front": "أمامي",
                "back": "خلفي",
                "top": "علوي",
                "view": "عرض"
            }
        },
        "detail": {
            "notFound": "لم يتم العثور على هذا المنتج.",
            "selectSizeFirst": "يرجى تحديد المقاس أو الخيار أولاً"
        },
        "cart": {
            "addedToCart": "تمت الإضافة إلى السلة"
        },
        "rentals": {
            "title": "التأجير",
            "noRentals": "لا توجد حجوزات تأجير حتى الآن",
            "browseRentals": "تصفح القطع المتاحة للإيجار",
            "durationOptions": "خيارات مدة التأجير",
            "fixedPackage": "باقة محددة",
            "customDates": "تواريخ مخصصة",
            "daysAccess": "أيام وصول كامل",
            "available": "القطعة متوفرة",
            "pickupTitle": "الاستلام والإرجاع من الأتيليه",
            "pickupSubtitle": "مجاناً · بولي ميدهانيالم",
            "deliveryTitle": "توصيل خاص عبر مندوب",
            "deliveryFee": "توصيل واستلام حتى باب المنزل",
            "duration": "مدة التأجير",
            "agreement": "أوافق على سياسة تأجير ورعاية الأزياء التقليدية لدى تيلت ثري دي. يتم استرداد التأمين تلقائياً بعد الفحص في الأتيليه.",
            "agreePrompt": "يرجى الموافقة على سياسة رعاية الأزياء للمتابعة.",
            "reserveBtn": "تأكيد والدفع عبر تشابا",
            "unavailableTitle": "التأجير غير متاح حالياً",
            "unavailableDesc": "هذه القطعة التراثية غير متاحة للتأجير في الوقت الراهن. يمكنك شراؤها مباشرة.",
            "periodLabel": "فترة التأجير:",
            "statusLabel": "الحالة الراهنة:",
            "fulfillmentLabel": "طريقة التسليم:",
            "addressLabel": "عنوان التوصيل:",
            "subtotalLabel": "المجموع الفرعي للإيجار:",
            "depositLabel": "مبلغ التأمين المسترد:",
            "deliveryFeeLabel": "رسوم التوصيل:",
            "totalLabel": "المبلغ الإجمالي:"
        },
        "checkout": {
            "tax": "ضريبة القيمة المضافة (15%)",
            "shippingFee": "الشحن والتوصيل",
            "totalDue": "المبلغ الإجمالي المستحق",
            "region": "المنطقة / الإقليم",
            "subCity": "البلدية / الحي",
            "woreda": "المنطقة الفرعية (وردا)",
            "houseNo": "رقم المنزل",
            "deliveryNote": "ملاحظات التوصيل (اختياري)",
            "chapaSecure": "🔒 دفع آمن ومشفر بدرجة 256 بت عبر تشابا. بالبير الإثيوبي (ETB).",
            "addressRequired": "عنوان التوصيل مطلوب للتوصيل عبر المندوب.",
            "secureEncryption": "تشفير آمن للبيانات",
            "orderNumber": "رقم الطلب",
            "paymentStatus": "حالة الدفع",
            "paymentProvider": "مزود خدمة الدفع",
            "transactionId": "معرّف المعاملة",
            "orderNote": "ملاحظات الطلب",
            "itemDescription": "وصف المنتج",
            "price": "السعر",
            "total": "المجموع",
            "itemsOrdered": "المنتجات المطلوبة",
            "customerNote": "ملاحظة العميل",
            "summary": "ملخص الطلب",
            "subtotal": "المجموع الفرعي",
            "discount": "الخصم",
            "goBack": "الرجوع",
            "continueShopping": "متابعة التسوق"
        },
        "avatar": {
            "nickname": "الاسم المستعار",
            "age": "العمر",
            "bodyType": "بنية الجسم",
            "shoulder": "الأكتاف",
            "weight": "الوزن",
            "controls": "أدوات تحكم الأتيليه",
            "controlsActive": "الأدوات مفعلة",
            "editBody": "تعديل القوام",
            "confirmAvatar": "تأكيد الصورة الرمزية",
            "walkTest": "اختبار المشي",
            "spin360": "دوران 360 درجة",
            "biometrics": "القياسات الحيوية",
            "height": "الطول",
            "structure": "الهيكل",
            "calibration": "المعايرة",
            "coutureMatch": "مطابقة الأزياء"
        },
        "ai": {
            "concierge": "مساعد تيلت الذكي",
            "ask": "اسأل تيلت ثري دي",
            "openFull": "فتح المحادثة الكاملة ←",
            "welcome": "مرحباً! أنا مساعدك الذكي في تيلت ثري دي. كيف يمكنني مساعدتك في اختيار أزيائك اليوم؟",
            "minimise": "تصغير",
            "prompt": {
                "tryOn": "كيف تعمل تجربة القياس الافتراضية؟",
                "outfit": "ساعدني في اختيار زي مناسب",
                "whatsNew": "ما الجديد في التشكيلة؟"
            },
            "suggestions": {
                "kemis": "ما هي تصاميم فساتين القميص الحبشية الرائجة؟",
                "netela": "ما هي الألوان المتوفرة لشال النتيلا؟",
                "tryon": "كيف تعمل تجربة القياس الافتراضية بالأفاتار؟"
            }
        },
        "settings": {
            "preferencesTitle": "الإعدادات الإقليمية والتفضيلات",
            "preferencesDesc": "خصص العملة واللغة وتفضيلات التنبيهات الخاصة بك.",
            "currencyLabel": "العملة المفضلة",
            "languageLabel": "لغة العرض",
            "notificationsTitle": "تفضيلات الإشعارات",
            "orderUpdates": "تحديثات الطلبات",
            "orderUpdatesDesc": "استلم تنبيهات عبر البريد الإلكتروني بشأن حالة الشحن والدفع.",
            "promotions": "العروض والمجموعات الجديدة",
            "promotionsDesc": "احصل على تحديثات دورية حول أحدث التصاميم والعروض الخاصة.",
            "fittingRoomAlerts": "تنبيهات غرفة القياس ثلاثية الأبعاد",
            "fittingRoomAlertsDesc": "احصل على إشعار عند تحديث نماذج الأفاتار أو المجسمات ثلاثية الأبعاد.",
            "saveChanges": "حفظ التغييرات",
            "saved": "تم الحفظ بنجاح!",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "يرجى تسجيل الدخول لإضافة المنتج إلى السلة",
                "store": "المتجر",
                "returnToCollection": "العودة إلى التشكيلة",
                "signIn": "تسجيل الدخول",
                "createAccount": "إنشاء حساب جديد",
                "verifyEmail": "تأكيد البريد الإلكتروني",
                "sendRecoveryCode": "إرسال رمز الاستعادة",
                "updatePassword": "تحديث كلمة المرور"
            },
            "dashboard": {
                "interactive3d": "قياس ثلاثي الأبعاد تفاعلي",
                "launchStudio": "فتح استوديو 3D",
                "browseCollection": "تصفح التشكيلة",
                "viewFullHistory": "عرض السجل الكامل",
                "backToHome": "العودة للرئيسية"
            }
        },
        "admin": {
            "staffAuth": "بيئة فريق العمل",
            "loadingDetails": "جار تحميل تفاصيل الطلب...",
            "refresh": "تحديث",
            "event": "الحدث",
            "user": "المستخدم",
            "ipAddress": "عنوان IP",
            "userAgent": "وكيل العميل",
            "timestamp": "الوقت والتاريخ",
            "customer": "العميل",
            "email": "البريد الإلكتروني",
            "orders": "الطلبات",
            "totalSpent": "إجمالي الإنفاق",
            "joined": "تاريخ الانضمام",
            "action": "الإجراء",
            "category": "التصنيف",
            "slug": "الاسم اللطيف",
            "assignedProducts": "المنتجات المرتبطة",
            "status": "الحالة",
            "product": "المنتج",
            "unitPrice": "سعر الوحدة",
            "physicalStock": "المخزون الفعلي",
            "reserved": "المحجوز",
            "available": "المتوفر",
            "addProduct": "إضافة منتج جديد",
            "allCategories": "جميع التصنيفات",
            "allStatuses": "جميع الحالات",
            "activeOnly": "النشط فقط",
            "inactiveOnly": "غير النشط فقط",
            "pending": "قيد الانتظار",
            "confirmed": "تم التأكيد",
            "processing": "قيد المعالجة",
            "shipped": "تم الشحن",
            "delivered": "تم التوصيل",
            "amount": "المبلغ",
            "orderNumber": "رقم الطلب",
            "gateway": "بوابة الدفع",
            "revenue": "الإيرادات",
            "unitsSold": "الوحدات المباعة"
        }
    },
    "sw": {
        "common": {
            "details": "Maelezo",
            "unisex": "Kwa Wote",
            "back": "Rudi",
            "loading": "Inapakia..."
        },
        "hero": {
            "gender": {
                "female": "Mwanamke",
                "male": "Mwanamume"
            }
        },
        "howItWorks": {
            "badge": "Jinsi inavyofanya kazi",
            "titleLead": "Kutoka vipimo vyako",
            "titleAccent": "hadi kutoshea kikamilifu.",
            "subtitle": "Tilet3D inabadilisha ushonaji wa kitamaduni wa Kihabesha kuwa uzoefu wa kisasa wa 3D kwa wakati halisi.",
            "stepLabel": "HATUA",
            "step1": {
                "title": "Tengeneza avatar yako",
                "desc": "Ingiza vipimo vichache na Tilet3D itaunda mfano halisi wa 3D wa umbo lako kwa ajili ya kupima mtandaoni."
            },
            "step2": {
                "title": "Jaribu mavazi ya kitamaduni",
                "desc": "Tazama mavazi yaliyofumwa kwa mikono yakikutoshea kwa wakati halisi. Zungusha, kurefusha na kuchunguza kila uzi."
            },
            "step3": {
                "title": "Agiza kwa ujasiri",
                "desc": "Chagua mtindo unaoupenda na uagize ukijua jinsi unavyokutoshea kabla ya ushonaji kuanza."
            }
        },
        "featured": {
            "atelier": "KARAKHANA YA TILET3D",
            "title": "Mkusanyiko Maalum",
            "tagline": "Ni vazi gani linalokuvutia zaidi?",
            "viewDetails": "Tazama Maelezo",
            "loadingMore": "Inapakia zaidi..."
        },
        "cultural": {
            "title": "Urithi wa Kitamaduni.",
            "wedding": "Harusi.",
            "oromo": "Oromo.",
            "tigray": "Tigray.",
            "amhara": "Amhara.",
            "weddingDesc": "Mkusanyiko wa Harusi",
            "oromoDesc": "Mkusanyiko wa mila. Kila uzi unasimulia historia ya vizazi vilivyopita, ukichanganywa na umaridadi wa kisasa.",
            "tigrayDesc": "Yenye mizizi ya kihistoria. Miundo ya kuvutia na kazi ya mikono yenye ustadi huakisi urithi wa karne nyingi.",
            "amharaDesc": "Urembo wa daima. Inasherehekea uzuri na ufundi wa pekee wa Kiethiopia katika kila mshono.",
            "noProducts": "Hakuna bidhaa zilizopatikana kwa"
        },
        "products": {
            "tryOn": "Jaribu kwenye Avatar",
            "rent": "Kodi",
            "bespoke": "Agizo Maalum",
            "backToCollection": "Rudi kwenye mkusanyiko",
            "addNote": "Andika ujumbe kuhusu vazi hili...",
            "post": "Chapisha",
            "sortBy": "Panga kwa",
            "sortNewest": "Vipya Zaidi",
            "sortPriceAsc": "Bei: Ndogo → Kubwa",
            "sortPriceDesc": "Bei: Kubwa → Ndogo",
            "sortRelevance": "Umuhimu",
            "categoriesLabel": "Kategoria",
            "priceRange": "Kiwango cha Bei",
            "budgetPrice": "Nafuu (<2K)",
            "midPrice": "Wastani",
            "premiumPrice": "Kifahari",
            "inStockOnly": "Zilizopo Ghalani Pekee",
            "viewResults": "Tazama Matokeo",
            "card": {
                "addToCart": "Weka Kikapuni (Nunua)",
                "addedToCart": "Imewekwa Kikapuni",
                "front": "Mbele",
                "back": "Nyuma",
                "top": "Juu",
                "view": "Tazama"
            }
        },
        "detail": {
            "notFound": "Bidhaa hii haijapatikana.",
            "selectSizeFirst": "Tafadhali chagua saizi au mtindo kwanza"
        },
        "cart": {
            "addedToCart": "Imewekwa kikapuni"
        },
        "rentals": {
            "title": "Kukodisha",
            "noRentals": "Bado hakuna ukodishaji",
            "browseRentals": "Tazama Mavazi ya Kukodisha",
            "durationOptions": "Chaguo za Muda wa Kukodi",
            "fixedPackage": "Kifurushi Maalum",
            "customDates": "Tarehe Maalum",
            "daysAccess": "Siku za Matumizi Kamili",
            "available": "Vazi Linapatikana",
            "pickupTitle": "Chukua na Rudisha Atelieri",
            "pickupSubtitle": "Bure · Bole Medhanialem",
            "deliveryTitle": "Usafirishaji kwa Mjumbe",
            "deliveryFee": "Uletaji na Uchukuzi Mlangoni",
            "duration": "Muda wa Kukodi",
            "agreement": "Ninakubali masharti ya ukodishaji na utunzaji wa vitambaa vya kitamaduni vya Tilet3D. Amana itarejeshwa baada ya ukaguzi.",
            "agreePrompt": "Tafadhali kubali masharti ya utunzaji ili kuendelea.",
            "reserveBtn": "Thibitisha & Lipa kwa Chapa",
            "unavailableTitle": "Ukodishaji Haufanyi Kazi Sasa",
            "unavailableDesc": "Vazi hili la kitamaduni halipatikani kwa ukodishaji kwa sasa. Unaweza kulinunua moja kwa moja.",
            "periodLabel": "Kipindi cha Kukodi:",
            "statusLabel": "Hali ya Sasa:",
            "fulfillmentLabel": "Njia ya Upokeaji:",
            "addressLabel": "Anwani ya Upelekaji:",
            "subtotalLabel": "Jumla Ndogo ya Kodi:",
            "depositLabel": "Amana ya Usalama:",
            "deliveryFeeLabel": "Gharama ya Usafirishaji:",
            "totalLabel": "Kiasi Kamili:"
        },
        "checkout": {
            "tax": "Ushuru (15% VAT)",
            "shippingFee": "Usafirishaji",
            "totalDue": "Jumla Inayodaiwa",
            "region": "Mkoa",
            "subCity": "Wilaya ya Jiji",
            "woreda": "Woreda",
            "houseNo": "Nambari ya Nyumba",
            "deliveryNote": "Maagizo ya Usafirishaji (Hiari)",
            "chapaSecure": "🔒 Malipo salama yenye ulinzi wa 256-bit kupitia Chapa. Sarafu ya Birr (ETB).",
            "addressRequired": "Anwani ya upelekaji inahitajika kwa usafirishaji wa mjumbe.",
            "secureEncryption": "Ulinzi Salama wa Data",
            "orderNumber": "Nambari ya Agizo",
            "paymentStatus": "Hali ya Malipo",
            "paymentProvider": "Mtoa Huduma wa Malipo",
            "transactionId": "Kitambulisho cha Muamala",
            "orderNote": "Maelezo ya Agizo",
            "itemDescription": "Maelezo ya Bidhaa",
            "price": "Bei",
            "total": "Jumla",
            "itemsOrdered": "Bidhaa Zilizoidhinishwa",
            "customerNote": "Ujumbe wa Mteja",
            "summary": "Muhtasari wa Agizo",
            "subtotal": "Jumla Ndogo",
            "discount": "Punguzo",
            "goBack": "Rudi Nyuma",
            "continueShopping": "Endelea na Ununuzi"
        },
        "avatar": {
            "nickname": "Jina la Utani",
            "age": "Umri",
            "bodyType": "Umbo la Mwili",
            "shoulder": "Mabega",
            "weight": "Uzito",
            "controls": "Vidhibiti vya Studio",
            "controlsActive": "Vidhibiti Vinafanya Kazi",
            "editBody": "Rekebisha Umbo",
            "confirmAvatar": "Thibitisha Avatar",
            "walkTest": "Jaribio la Kutembea",
            "spin360": "Zungusha 360°",
            "biometrics": "Vipimo vya Mwili",
            "height": "Urefu",
            "structure": "Muundo",
            "calibration": "Urekebishaji",
            "coutureMatch": "Kipimo cha Vazi"
        },
        "ai": {
            "concierge": "Msaidizi wa Tilet AI",
            "ask": "Uliza Tilet3D",
            "openFull": "Fungua gumzo kamili →",
            "welcome": "Habari! Mimi ni Msaidizi wako wa Tilet3D AI. Ninawezaje kukusaidia leo katika kuchagua mavazi?",
            "minimise": "Punguza",
            "prompt": {
                "tryOn": "Je, kupima mavazi kwa 3D kunafanya kazi vipi?",
                "outfit": "Nisaidie kuchagua vazi",
                "whatsNew": "Kuna vitu gani vipya kwenye mkusanyiko?"
            },
            "suggestions": {
                "kemis": "Je, ni mitindo gani ya Habesha Kemis inayopendwa zaidi?",
                "netela": "Ni rangi gani zinazopatikana kwenye Netela?",
                "tryon": "Je, avatar ya 3D inafanya kazi vipi?"
            }
        },
        "settings": {
            "preferencesTitle": "Eneo & Mapendeleo",
            "preferencesDesc": "Weka sarafu, lugha na mapendeleo yako ya taarifa.",
            "currencyLabel": "Sarafu Unayopendelea",
            "languageLabel": "Lugha ya Kuonyesha",
            "notificationsTitle": "Mapendeleo ya Taarifa",
            "orderUpdates": "Habari za Maagizo",
            "orderUpdatesDesc": "Pokea barua pepe kuhusu hali ya usafirishaji na malipo.",
            "promotions": "Ofa & Mikusanyiko",
            "promotionsDesc": "Pata taarifa za mara kwa mara kuhusu mitindo mipya na mauzo maalum.",
            "fittingRoomAlerts": "Taarifa za Chumba cha 3D",
            "fittingRoomAlertsDesc": "Arifiwa avatar yako au umbo la 3D linaposasishwa.",
            "saveChanges": "Hifadhi Mabadiliko",
            "saved": "Imehifadhiwa!",
            "languages": {
                "om": "Afaan Oromoo",
                "am": "አማርኛ",
                "en": "English",
                "ti": "ትግርኛ",
                "fr": "Français",
                "ar": "العربية",
                "sw": "Kiswahili"
            }
        },
        "account": {
            "auth": {
                "signInToAddBag": "Tafadhali ingia ili kuweka bidhaa kikapuni",
                "store": "Duka",
                "returnToCollection": "Rudi kwenye mkusanyiko",
                "signIn": "Ingia",
                "createAccount": "Fungua Akaunti",
                "verifyEmail": "Thibitisha Barua Pepe",
                "sendRecoveryCode": "Tuma Nambari ya Urejeshaji",
                "updatePassword": "Sasisha Nenosiri"
            },
            "dashboard": {
                "interactive3d": "Upimaji Halisi wa 3D",
                "launchStudio": "Fungua Studio ya 3D",
                "browseCollection": "Tazama Mkusanyiko",
                "viewFullHistory": "Tazama Historia Kamili",
                "backToHome": "Rudi Mwanzo"
            }
        },
        "admin": {
            "staffAuth": "Mazingira ya Wafanyakazi",
            "loadingDetails": "Inapakia maelezo ya agizo...",
            "refresh": "Onyesha Upya",
            "event": "Tukio",
            "user": "Mtumiaji",
            "ipAddress": "Anwani ya IP",
            "userAgent": "Kifaa cha Mteja",
            "timestamp": "Wakati",
            "customer": "Mteja",
            "email": "Barua Pepe",
            "orders": "Maagizo",
            "totalSpent": "Jumla Iliyotumika",
            "joined": "Amejiunga",
            "action": "Hatua",
            "category": "Kategoria",
            "slug": "Slug",
            "assignedProducts": "Bidhaa Zilizopangwa",
            "status": "Hali",
            "product": "Bidhaa",
            "unitPrice": "Bei ya Kipande",
            "physicalStock": "Hisa Zilizopo",
            "reserved": "Imehifadhiwa",
            "available": "Inapatikana",
            "addProduct": "Ongeza Bidhaa",
            "allCategories": "Kategoria Zote",
            "allStatuses": "Hali Zote",
            "activeOnly": "Amilifu Pekee",
            "inactiveOnly": "Zisizo Amilifu Pekee",
            "pending": "Inasubiri",
            "confirmed": "Imethibitishwa",
            "processing": "Inashughulikiwa",
            "shipped": "Imesafirishwa",
            "delivered": "Imewasilishwa",
            "amount": "Kiasi",
            "orderNumber": "Nambari ya Agizo",
            "gateway": "Lango la Malipo",
            "revenue": "Mapato",
            "unitsSold": "Zilizouzwa"
        }
    }
}

def deep_merge(target, source):
    for k, v in source.items():
        if isinstance(v, dict) and k in target and isinstance(target[k], dict):
            deep_merge(target[k], v)
        else:
            target[k] = v

def main():
    print("Updating translation dictionaries across all 7 locales...")
    for lang in LANGUAGES:
        path = os.path.join(LOCALES_DIR, lang, "translation.json")
        data = {}
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        
        ext = EXTENSIONS.get(lang, {})
        deep_merge(data, ext)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"  [OK] Successfully updated {lang}/translation.json")

if __name__ == "__main__":
    main()

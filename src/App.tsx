import { useMemo, useState } from "react";
import { evaluateRedFlags } from "./red-flag-rules";
import type { LanguageCode, SymptomSignal, TriageFacts } from "./triage-schema";

type Language = "English" | "हिन्दी" | "বাংলা" | "ଓଡ଼ିଆ" | "Hinglish";
type AgeBand = TriageFacts["ageBand"];

const languageToCode: Record<Language, LanguageCode> = {
  English: "en", "हिन्दी": "hi", "বাংলা": "bn", "ଓଡ଼ିଆ": "or", Hinglish: "hinglish",
};

const copy: Record<Language, Record<string, string>> = {
  English: {
    prototype: "Prototype · not for real emergencies", language: "Language", immediate: "Immediate help",
    callFirst: "If someone may be in danger, call first", nationalEmergency: "National emergency",
    introKicker: "Call-first triage", title: "Help someone get to the right help, faster.",
    intro: "Choose what is happening. LifeSafe keeps emergency help visible. This prototype cannot diagnose or confirm that someone is safe.",
    step1: "Start with what you know", what: "What is happening?", noAccount: "No account · nothing saved",
    lede: "Select any signs that are present. If you are unsure, choose the closest option or call emergency services.",
    step2: "Safety check", ready: "Ready when you are", callNow: "Call emergency services now",
    notEnough: "Not enough information", startCopy: "Select a concern to see the next safe step. A red flag always takes priority.",
    emergencyHeading: "Emergency warning sign selected", emergencyCopy: "Call 112 now. Do not wait for this screen to finish.",
    selected: "Selected warning signs", call112: "Call 112", uncertainCopy: "No emergency rule matched these selections. This does not mean the person is safe. Contact a qualified healthcare professional, especially if symptoms persist, worsen or concern you.",
    review: "Review selections", step3: "Optional context", who: "Who is affected?", adult: "Adult", child: "Child", infant: "Infant", unknown: "Not sure",
    ageMonths: "Age in months", privacy: "Private by default", privacyCopy: "This prototype does not send or store your answers.",
    draft: "Safety content status: draft, not clinically approved", footer: "Clinical review and validation are required before real-world use.",
    breathing: "Breathing is difficult", breathingDetail: "Short of breath, wheezing, or struggling",
    chest: "Chest pain or pressure", chestDetail: "New pain, heaviness, or tightness",
    stroke: "Possible stroke warning sign", strokeDetail: "Face, arm, speech, balance, or vision changes",
    bleeding: "Heavy or uncontrolled bleeding", bleedingDetail: "Fast, pooling, or difficult to control",
    unconsciousNoBreath: "Unresponsive and not breathing normally", unconsciousNoBreathDetail: "Includes gasping or abnormal breathing",
    unconsciousBreathing: "Unresponsive but breathing normally", unconsciousBreathingDetail: "Not waking or responding as usual",
    seizure: "Seizure", seizureDetail: "A seizure is happening or has recently happened",
    poisoning: "Possible poisoning", poisoningDetail: "Medicine, chemical, pesticide, or unknown substance",
    snakebite: "Possible snakebite", snakebiteDetail: "A suspected snakebite needs urgent medical assessment",
    fever: "Fever or unusually low temperature", feverDetail: "Select this especially for a young baby",
    allergy: "Severe allergic reaction", allergyDetail: "Swelling, breathing symptoms, or collapse",
    dehydration: "Possible severe dehydration", dehydrationDetail: "Very drowsy, unable to drink, or very unwell",
    emotional: "Urgent emotional safety concern", emotionalDetail: "Connect with immediate professional support",
    other: "Something else", otherDetail: "Contact a healthcare professional for assessment",
  },
  "हिन्दी": {
    prototype: "प्रोटोटाइप · वास्तविक आपात स्थिति के लिए नहीं", language: "भाषा", immediate: "तत्काल सहायता",
    callFirst: "किसी की जान को खतरा हो सकता है, तो पहले कॉल करें", nationalEmergency: "राष्ट्रीय आपातकालीन सेवा",
    introKicker: "पहले कॉल करें", title: "सही मदद तक जल्दी पहुँचने में सहायता करें।",
    intro: "स्थिति चुनें। LifeSafe आपातकालीन सहायता को हमेशा उपलब्ध रखता है। यह प्रोटोटाइप बीमारी का निदान या सुरक्षा की पुष्टि नहीं कर सकता।",
    step1: "जो जानकारी है उससे शुरू करें", what: "क्या हो रहा है?", noAccount: "खाता नहीं · जानकारी सेव नहीं होती",
    lede: "मौजूद संकेत चुनें। संदेह होने पर निकटतम विकल्प चुनें या आपातकालीन सेवा को कॉल करें।",
    step2: "सुरक्षा जाँच", ready: "शुरू करने के लिए तैयार", callNow: "अभी आपातकालीन सेवा को कॉल करें",
    notEnough: "पर्याप्त जानकारी नहीं", startCopy: "अगला सुरक्षित कदम देखने के लिए स्थिति चुनें। खतरे के संकेत को हमेशा प्राथमिकता दी जाती है।",
    emergencyHeading: "आपातकालीन चेतावनी संकेत चुना गया", emergencyCopy: "अभी 112 पर कॉल करें। इस स्क्रीन के पूरा होने की प्रतीक्षा न करें।",
    selected: "चुने गए चेतावनी संकेत", call112: "112 पर कॉल करें", uncertainCopy: "चुने गए विकल्पों से कोई आपातकालीन नियम सक्रिय नहीं हुआ। इसका अर्थ यह नहीं कि व्यक्ति सुरक्षित है। लक्षण बने रहें, बढ़ें या चिंता हो तो योग्य स्वास्थ्यकर्मी से संपर्क करें।",
    review: "चयन की समीक्षा करें", step3: "वैकल्पिक जानकारी", who: "किसे परेशानी है?", adult: "वयस्क", child: "बच्चा", infant: "शिशु", unknown: "पता नहीं",
    ageMonths: "महीनों में आयु", privacy: "डिफ़ॉल्ट रूप से निजी", privacyCopy: "यह प्रोटोटाइप आपके उत्तर नहीं भेजता या सहेजता है।",
    draft: "सुरक्षा सामग्री: प्रारूप, चिकित्सकीय स्वीकृति नहीं", footer: "वास्तविक उपयोग से पहले चिकित्सकीय समीक्षा और सत्यापन आवश्यक है।",
    breathing: "साँस लेने में कठिनाई", breathingDetail: "साँस फूलना, घरघराहट या साँस लेने में संघर्ष",
    chest: "सीने में दर्द या दबाव", chestDetail: "नया दर्द, भारीपन या जकड़न",
    stroke: "स्ट्रोक का संभावित चेतावनी संकेत", strokeDetail: "चेहरे, बाँह, बोलने, संतुलन या दृष्टि में बदलाव",
    bleeding: "बहुत अधिक या न रुकने वाला रक्तस्राव", bleedingDetail: "तेज़ बहना, जमा होना या नियंत्रित न होना",
    unconsciousNoBreath: "बेहोश और सामान्य रूप से साँस नहीं ले रहा", unconsciousNoBreathDetail: "हांफना या असामान्य साँस लेना भी शामिल है",
    unconsciousBreathing: "बेहोश, लेकिन सामान्य रूप से साँस ले रहा", unconsciousBreathingDetail: "सामान्य रूप से जाग या प्रतिक्रिया नहीं कर रहा",
    seizure: "दौरा", seizureDetail: "दौरा अभी हो रहा है या हाल ही में हुआ है",
    poisoning: "ज़हर का संभावित संपर्क", poisoningDetail: "दवा, रसायन, कीटनाशक या अज्ञात पदार्थ",
    snakebite: "साँप के काटने की आशंका", snakebiteDetail: "तुरंत चिकित्सकीय जाँच आवश्यक है",
    fever: "बुखार या असामान्य रूप से कम तापमान", feverDetail: "छोटे शिशु के लिए विशेष रूप से चुनें",
    allergy: "गंभीर एलर्जी प्रतिक्रिया", allergyDetail: "सूजन, साँस की समस्या या बेहोशी",
    dehydration: "गंभीर निर्जलीकरण की आशंका", dehydrationDetail: "बहुत सुस्ती, पानी न पी पाना या गंभीर अस्वस्थता",
    emotional: "तत्काल भावनात्मक सुरक्षा सहायता", emotionalDetail: "तुरंत पेशेवर सहायता से जुड़ें",
    other: "कुछ और", otherDetail: "जाँच के लिए स्वास्थ्यकर्मी से संपर्क करें",
  },
  "বাংলা": {
    prototype: "প্রোটোটাইপ · বাস্তব জরুরি অবস্থার জন্য নয়", language: "ভাষা", immediate: "জরুরি সহায়তা",
    callFirst: "কারও বিপদ হতে পারে মনে হলে আগে ফোন করুন", nationalEmergency: "জাতীয় জরুরি পরিষেবা",
    introKicker: "আগে ফোন করুন", title: "দ্রুত সঠিক সহায়তা পেতে সাহায্য করুন।",
    intro: "কী ঘটছে তা বেছে নিন। LifeSafe জরুরি সহায়তার বিকল্প দেখায়। এই প্রোটোটাইপ রোগ নির্ণয় বা নিরাপত্তা নিশ্চিত করতে পারে না।",
    step1: "যা জানেন তা দিয়ে শুরু করুন", what: "কী ঘটছে?", noAccount: "অ্যাকাউন্ট নেই · কিছু সংরক্ষণ হয় না",
    lede: "যে লক্ষণগুলি আছে সেগুলি বেছে নিন। নিশ্চিত না হলে কাছাকাছি বিকল্প বেছে নিন বা জরুরি পরিষেবায় ফোন করুন।",
    step2: "নিরাপত্তা পরীক্ষা", ready: "আপনি প্রস্তুত হলে শুরু করুন", callNow: "এখনই জরুরি পরিষেবায় ফোন করুন",
    notEnough: "সিদ্ধান্তের জন্য যথেষ্ট তথ্য নেই", startCopy: "পরবর্তী নিরাপদ পদক্ষেপ দেখতে একটি বিষয় বেছে নিন। বিপদের লক্ষণ সবসময় অগ্রাধিকার পায়।",
    emergencyHeading: "জরুরি সতর্কতা চিহ্ন বেছে নেওয়া হয়েছে", emergencyCopy: "এখনই ১১২ নম্বরে ফোন করুন। এই স্ক্রিন শেষ হওয়ার জন্য অপেক্ষা করবেন না।",
    selected: "নির্বাচিত সতর্কতা চিহ্ন", call112: "১১২-এ ফোন করুন", uncertainCopy: "এই নির্বাচনে কোনো জরুরি নিয়ম মেলেনি। এর অর্থ এই নয় যে ব্যক্তি নিরাপদ। লক্ষণ থাকলে, বাড়লে বা উদ্বেগ থাকলে যোগ্য স্বাস্থ্যকর্মীর সঙ্গে যোগাযোগ করুন।",
    review: "নির্বাচন পর্যালোচনা করুন", step3: "ঐচ্ছিক তথ্য", who: "কার সমস্যা হচ্ছে?", adult: "প্রাপ্তবয়স্ক", child: "শিশু", infant: "অতি ছোট শিশু", unknown: "নিশ্চিত নই",
    ageMonths: "মাসে বয়স", privacy: "ডিফল্টভাবে ব্যক্তিগত", privacyCopy: "এই প্রোটোটাইপ আপনার উত্তর পাঠায় বা সংরক্ষণ করে না।",
    draft: "নিরাপত্তা বিষয়বস্তু: খসড়া, চিকিৎসাগত অনুমোদিত নয়", footer: "বাস্তব ব্যবহারের আগে চিকিৎসাগত পর্যালোচনা ও যাচাই দরকার।",
    breathing: "শ্বাস নিতে কষ্ট হচ্ছে", breathingDetail: "শ্বাসকষ্ট, শোঁ শোঁ শব্দ বা শ্বাস নিতে সংগ্রাম",
    chest: "বুকে ব্যথা বা চাপ", chestDetail: "নতুন ব্যথা, ভারীভাব বা আঁটসাঁট অনুভূতি",
    stroke: "স্ট্রোকের সম্ভাব্য সতর্কতা চিহ্ন", strokeDetail: "মুখ, হাত, কথা, ভারসাম্য বা দৃষ্টির পরিবর্তন",
    bleeding: "প্রচুর বা বন্ধ না হওয়া রক্তপাত", bleedingDetail: "দ্রুত রক্তপাত, জমে যাওয়া বা নিয়ন্ত্রণ করা কঠিন",
    unconsciousNoBreath: "অচেতন এবং স্বাভাবিকভাবে শ্বাস নিচ্ছে না", unconsciousNoBreathDetail: "হাঁপানো বা অস্বাভাবিক শ্বাসও অন্তর্ভুক্ত",
    unconsciousBreathing: "অচেতন, তবে স্বাভাবিকভাবে শ্বাস নিচ্ছে", unconsciousBreathingDetail: "স্বাভাবিকভাবে জাগছে বা সাড়া দিচ্ছে না",
    seizure: "খিঁচুনি", seizureDetail: "খিঁচুনি হচ্ছে বা সম্প্রতি হয়েছে",
    poisoning: "বিষক্রিয়ার সম্ভাবনা", poisoningDetail: "ওষুধ, রাসায়নিক, কীটনাশক বা অজানা পদার্থ",
    snakebite: "সাপের কামড়ের সম্ভাবনা", snakebiteDetail: "জরুরি চিকিৎসা মূল্যায়ন প্রয়োজন",
    fever: "জ্বর বা অস্বাভাবিক কম তাপমাত্রা", feverDetail: "খুব ছোট শিশুর ক্ষেত্রে বিশেষভাবে বেছে নিন",
    allergy: "গুরুতর অ্যালার্জির প্রতিক্রিয়া", allergyDetail: "ফোলা, শ্বাসের সমস্যা বা অজ্ঞান হওয়া",
    dehydration: "গুরুতর পানিশূন্যতার সম্ভাবনা", dehydrationDetail: "অত্যন্ত ঝিমুনি, পান করতে না পারা বা খুব অসুস্থ বোধ",
    emotional: "জরুরি মানসিক নিরাপত্তা সহায়তা", emotionalDetail: "অবিলম্বে পেশাদার সহায়তার সঙ্গে যোগাযোগ করুন",
    other: "অন্য কিছু", otherDetail: "মূল্যায়নের জন্য স্বাস্থ্যকর্মীর সঙ্গে যোগাযোগ করুন",
  },
  "ଓଡ଼ିଆ": {
    prototype: "ପ୍ରୋଟୋଟାଇପ୍ · ପ୍ରକୃତ ଜରୁରୀ ପରିସ୍ଥିତି ପାଇଁ ନୁହେଁ", language: "ଭାଷା", immediate: "ତୁରନ୍ତ ସହାୟତା",
    callFirst: "କାହାରି ବିପଦ ଥାଇପାରେ, ପ୍ରଥମେ କଲ୍ କରନ୍ତୁ", nationalEmergency: "ଜାତୀୟ ଜରୁରୀକାଳୀନ ସେବା",
    introKicker: "ପ୍ରଥମେ କଲ୍ କରନ୍ତୁ", title: "ଠିକ୍ ସହାୟତା ଶୀଘ୍ର ପାଇବାରେ ସାହାଯ୍ୟ କରନ୍ତୁ।",
    intro: "କ’ଣ ଘଟୁଛି ବାଛନ୍ତୁ। LifeSafe ଜରୁରୀ ସହାୟତାକୁ ସହଜରେ ଦେଖାଏ। ଏହି ପ୍ରୋଟୋଟାଇପ୍ ରୋଗ ନିର୍ଣ୍ଣୟ କିମ୍ବା ସୁରକ୍ଷା ନିଶ୍ଚିତ କରିପାରେ ନାହିଁ।",
    step1: "ଆପଣ ଯାହା ଜାଣନ୍ତି ସେଥିରୁ ଆରମ୍ଭ କରନ୍ତୁ", what: "କ’ଣ ଘଟୁଛି?", noAccount: "ଆକାଉଣ୍ଟ ନାହିଁ · କିଛି ସଞ୍ଚୟ ହୁଏ ନାହିଁ",
    lede: "ଯେଉଁ ଲକ୍ଷଣ ଅଛି ସେଗୁଡ଼ିକ ବାଛନ୍ତୁ। ନିଶ୍ଚିତ ନହେଲେ ନିକଟତମ ବିକଳ୍ପ ବାଛନ୍ତୁ କିମ୍ବା ଜରୁରୀ ସେବାକୁ କଲ୍ କରନ୍ତୁ।",
    step2: "ସୁରକ୍ଷା ଯାଞ୍ଚ", ready: "ଆପଣ ପ୍ରସ୍ତୁତ ହେଲେ", callNow: "ଏବେ ଜରୁରୀ ସେବାକୁ କଲ୍ କରନ୍ତୁ",
    notEnough: "ନିଷ୍ପତ୍ତି ପାଇଁ ପର୍ଯ୍ୟାପ୍ତ ତଥ୍ୟ ନାହିଁ", startCopy: "ପରବର୍ତ୍ତୀ ସୁରକ୍ଷିତ ପଦକ୍ଷେପ ଦେଖିବାକୁ ଏକ ସମସ୍ୟା ବାଛନ୍ତୁ। ବିପଦ ସଙ୍କେତକୁ ସର୍ବଦା ପ୍ରାଥମିକତା ଦିଆଯାଏ।",
    emergencyHeading: "ଜରୁରୀ ସତର୍କ ସଙ୍କେତ ବାଛାଯାଇଛି", emergencyCopy: "ଏବେ ୧୧୨ କୁ କଲ୍ କରନ୍ତୁ। ଏହି ସ୍କ୍ରିନ୍ ଶେଷ ହେବାକୁ ଅପେକ୍ଷା କରନ୍ତୁ ନାହିଁ।",
    selected: "ବାଛାଯାଇଥିବା ସତର୍କ ସଙ୍କେତ", call112: "୧୧୨ କୁ କଲ୍ କରନ୍ତୁ", uncertainCopy: "ଏହି ବିକଳ୍ପଗୁଡ଼ିକରେ କୌଣସି ଜରୁରୀ ନିୟମ ମିଳିଲା ନାହିଁ। ଏହାର ଅର୍ଥ ବ୍ୟକ୍ତି ସୁରକ୍ଷିତ ବୋଲି ନୁହେଁ। ଲକ୍ଷଣ ରହିଲେ, ବଢ଼ିଲେ କିମ୍ବା ଚିନ୍ତା ହେଲେ ଯୋଗ୍ୟ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ଯୋଗାଯୋଗ କରନ୍ତୁ।",
    review: "ବାଛାଯାଇଥିବା ବିକଳ୍ପ ଯାଞ୍ଚ କରନ୍ତୁ", step3: "ଇଚ୍ଛାଧୀନ ତଥ୍ୟ", who: "କାହାର ସମସ୍ୟା?", adult: "ବୟସ୍କ", child: "ଶିଶୁ", infant: "ନବଜାତ / ଛୋଟ ଶିଶୁ", unknown: "ଜଣା ନାହିଁ",
    ageMonths: "ମାସରେ ବୟସ", privacy: "ଡିଫଲ୍ଟ ଭାବେ ବ୍ୟକ୍ତିଗତ", privacyCopy: "ଏହି ପ୍ରୋଟୋଟାଇପ୍ ଆପଣଙ୍କ ଉତ୍ତର ପଠାଏ କିମ୍ବା ସଞ୍ଚୟ କରେ ନାହିଁ।",
    draft: "ସୁରକ୍ଷା ବିଷୟବସ୍ତୁ: ଖସଡ଼ା, ଚିକିତ୍ସାଗତ ଅନୁମୋଦିତ ନୁହେଁ", footer: "ପ୍ରକୃତ ବ୍ୟବହାର ପୂର୍ବରୁ ଚିକିତ୍ସାଗତ ସମୀକ୍ଷା ଓ ଯାଞ୍ଚ ଆବଶ୍ୟକ।",
    breathing: "ଶ୍ୱାସ ନେବାରେ କଷ୍ଟ", breathingDetail: "ଶ୍ୱାସକଷ୍ଟ, ଘରଘର ଶବ୍ଦ କିମ୍ବା ଶ୍ୱାସ ନେବାରେ ସଂଘର୍ଷ",
    chest: "ଛାତିରେ ଯନ୍ତ୍ରଣା କିମ୍ବା ଚାପ", chestDetail: "ନୂଆ ଯନ୍ତ୍ରଣା, ଭାରି ଲାଗିବା କିମ୍ବା ଚାପ",
    stroke: "ଷ୍ଟ୍ରୋକ୍‌ର ସମ୍ଭାବ୍ୟ ସତର୍କ ସଙ୍କେତ", strokeDetail: "ମୁହଁ, ହାତ, କଥା, ସନ୍ତୁଳନ କିମ୍ବା ଦୃଷ୍ଟିରେ ପରିବର୍ତ୍ତନ",
    bleeding: "ଅଧିକ କିମ୍ବା ବନ୍ଦ ହେଉନଥିବା ରକ୍ତସ୍ରାବ", bleedingDetail: "ଦ୍ରୁତ ରକ୍ତସ୍ରାବ, ଜମା ହେବା କିମ୍ବା ନିୟନ୍ତ୍ରଣ କରିବା କଷ୍ଟ",
    unconsciousNoBreath: "ଅଚେତ ଏବଂ ସାଧାରଣ ଭାବେ ଶ୍ୱାସ ନେଉନାହାନ୍ତି", unconsciousNoBreathDetail: "ହାଁଫିବା କିମ୍ବା ଅସ୍ୱାଭାବିକ ଶ୍ୱାସ ମଧ୍ୟ ଏଥିରେ ଅନ୍ତର୍ଭୁକ୍ତ",
    unconsciousBreathing: "ଅଚେତ, କିନ୍ତୁ ସାଧାରଣ ଭାବେ ଶ୍ୱାସ ନେଉଛନ୍ତି", unconsciousBreathingDetail: "ସାଧାରଣ ଭାବେ ଜାଗୁନାହାନ୍ତି କିମ୍ବା ପ୍ରତିକ୍ରିୟା ଦେଉନାହାନ୍ତି",
    seizure: "ଖିଚୁଣି", seizureDetail: "ଖିଚୁଣି ହେଉଛି କିମ୍ବା ନିକଟରେ ହୋଇଛି",
    poisoning: "ବିଷକ୍ରିୟାର ସନ୍ଦେହ", poisoningDetail: "ଔଷଧ, ରାସାୟନିକ ପଦାର୍ଥ, କୀଟନାଶକ କିମ୍ବା ଅଜଣା ପଦାର୍ଥ",
    snakebite: "ସାପ କାମୁଡ଼ିଥିବା ସନ୍ଦେହ", snakebiteDetail: "ତୁରନ୍ତ ଚିକିତ୍ସାଗତ ଯାଞ୍ଚ ଆବଶ୍ୟକ",
    fever: "ଜ୍ୱର କିମ୍ବା ଅସ୍ୱାଭାବିକ କମ୍ ତାପମାତ୍ରା", feverDetail: "ଅତି ଛୋଟ ଶିଶୁ ପାଇଁ ବିଶେଷ ଭାବେ ବାଛନ୍ତୁ",
    allergy: "ଗୁରୁତର ଆଲର୍ଜି ପ୍ରତିକ୍ରିୟା", allergyDetail: "ଫୁଲିବା, ଶ୍ୱାସ ସମସ୍ୟା କିମ୍ବା ଅଚେତ ହେବା",
    dehydration: "ଗୁରୁତର ଜଳଶୂନ୍ୟତାର ସନ୍ଦେହ", dehydrationDetail: "ଅତ୍ୟଧିକ ନିଦ୍ରାଳୁ, ପିଇବାକୁ ଅସମର୍ଥ କିମ୍ବା ବହୁତ ଅସୁସ୍ଥ",
    emotional: "ତୁରନ୍ତ ମାନସିକ ସୁରକ୍ଷା ସହାୟତା", emotionalDetail: "ତୁରନ୍ତ ବୃତ୍ତିଗତ ସହାୟତା ନିଅନ୍ତୁ",
    other: "ଅନ୍ୟ କିଛି", otherDetail: "ଯାଞ୍ଚ ପାଇଁ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ଯୋଗାଯୋଗ କରନ୍ତୁ",
  },
  Hinglish: {
    prototype: "Prototype · real emergency ke liye nahi", language: "Language", immediate: "Turant madad",
    callFirst: "Agar kisi ko danger ho sakta hai, pehle call karein", nationalEmergency: "National emergency",
    introKicker: "Call-first triage", title: "Sahi help tak jaldi pahunchne mein madad karein.",
    intro: "Kya ho raha hai select karein. LifeSafe emergency help ko visible rakhta hai. Yeh prototype diagnosis ya safety confirm nahi karta.",
    step1: "Jo pata hai usse shuru karein", what: "Kya ho raha hai?", noAccount: "No account · kuch save nahi hota",
    lede: "Jo signs present hain unhe select karein. Doubt ho toh closest option choose karein ya emergency services ko call karein.",
    step2: "Safety check", ready: "Jab aap ready hon", callNow: "Abhi emergency services ko call karein",
    notEnough: "Decision ke liye enough information nahi", startCopy: "Next safe step dekhne ke liye concern select karein. Red flag ko hamesha priority milti hai.",
    emergencyHeading: "Emergency warning sign selected", emergencyCopy: "Abhi 112 par call karein. Screen complete hone ka wait na karein.",
    selected: "Selected warning signs", call112: "Call 112", uncertainCopy: "In selections se koi emergency rule match nahi hua. Iska matlab safe hona nahi hai. Symptoms bane rahein, badhein ya concern ho toh qualified healthcare professional se baat karein.",
    review: "Selections review karein", step3: "Optional details", who: "Kisko problem hai?", adult: "Adult", child: "Child", infant: "Infant", unknown: "Pata nahi",
    ageMonths: "Age in months", privacy: "Default se private", privacyCopy: "Yeh prototype aapke answers send ya store nahi karta.",
    draft: "Safety content: draft, clinically approved nahi", footer: "Real-world use se pehle clinical review aur validation zaroori hai.",
    breathing: "Saans lene mein dikkat", breathingDetail: "Saans phoolna, wheezing ya saans lene mein struggle",
    chest: "Chest pain ya pressure", chestDetail: "Naya pain, heaviness ya tightness",
    stroke: "Possible stroke warning sign", strokeDetail: "Face, arm, speech, balance ya vision mein change",
    bleeding: "Heavy ya control na hone wala bleeding", bleedingDetail: "Tez bleeding, pooling ya control karna mushkil",
    unconsciousNoBreath: "Unresponsive aur normal breathing nahi", unconsciousNoBreathDetail: "Gasping ya abnormal breathing bhi shamil hai",
    unconsciousBreathing: "Unresponsive lekin normal breathing hai", unconsciousBreathingDetail: "Normal tarah se jag ya respond nahi kar raha",
    seizure: "Seizure", seizureDetail: "Seizure ho raha hai ya haal hi mein hua hai",
    poisoning: "Possible poisoning", poisoningDetail: "Medicine, chemical, pesticide ya unknown substance",
    snakebite: "Possible snakebite", snakebiteDetail: "Urgent medical assessment zaroori hai",
    fever: "Fever ya unusually low temperature", feverDetail: "Chhote baby ke liye specially select karein",
    allergy: "Severe allergic reaction", allergyDetail: "Swelling, breathing symptoms ya collapse",
    dehydration: "Possible severe dehydration", dehydrationDetail: "Bahut drowsy, pee nahi pa raha ya bahut unwell",
    emotional: "Urgent emotional safety support", emotionalDetail: "Turant professional support se connect karein",
    other: "Kuch aur", otherDetail: "Assessment ke liye healthcare professional se contact karein",
  },
};

const concernDefinitions = [
  ["breathing_difficulty", "breathing", "breathingDetail"],
  ["chest_pain", "chest", "chestDetail"],
  ["face_droop", "stroke", "strokeDetail"],
  ["severe_bleeding", "bleeding", "bleedingDetail"],
  ["unresponsive_not_breathing", "unconsciousNoBreath", "unconsciousNoBreathDetail"],
  ["unresponsive_breathing_normally", "unconsciousBreathing", "unconsciousBreathingDetail"],
  ["seizure", "seizure", "seizureDetail"],
  ["suspected_poisoning", "poisoning", "poisoningDetail"],
  ["snakebite", "snakebite", "snakebiteDetail"],
  ["fever", "fever", "feverDetail"],
  ["severe_allergic_reaction", "allergy", "allergyDetail"],
  ["severe_dehydration", "dehydration", "dehydrationDetail"],
  ["suicidal_ideation", "emotional", "emotionalDetail"],
  ["other_reported_symptom", "other", "otherDetail"],
] as const satisfies readonly (readonly [SymptomSignal, string, string])[];

function LineIcon({ name }: { name: "phone" | "arrow" | "shield" | "plus" | "chevron" }) {
  const paths = {
    phone: <><path d="M7.2 3.5 5.8 6.8c1.2 2.5 3 4.4 5.5 5.5l3.3-1.4 1.7 1.7c.5.5.5 1.2.1 1.7-.6.8-1.5 1.2-2.5 1.1C9.9 15 5 10.1 4.6 6.1c-.1-1 .3-1.9 1.1-2.5.5-.4 1.2-.4 1.7.1l1.7 1.7Z" /></>,
    arrow: <><path d="M4 8h9" /><path d="m9 4 4 4-4 4" /></>,
    shield: <><path d="M8 2.5 13 4v3.8c0 3.1-2.1 5.7-5 6.7-2.9-1-5-3.6-5-6.7V4l5-1.5Z" /><path d="m5.5 8 1.6 1.6L10.7 6" /></>,
    plus: <><path d="M8 3v10M3 8h10" /></>,
    chevron: <path d="m5 6 3 3 3-3" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 16 16" className="line-icon" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function EmergencyActions({ t }: { t: (key: string) => string }) {
  return (
    <section className="emergency-strip" aria-labelledby="emergency-heading">
      <div className="emergency-copy"><span className="status-dot" aria-hidden="true" /><div><p className="eyebrow">{t("immediate")}</p><h2 id="emergency-heading">{t("callFirst")}</h2></div></div>
      <div className="call-actions"><a className="call-button call-button-primary" href="tel:112"><LineIcon name="phone" /><span><strong>112</strong><small>{t("nationalEmergency")}</small></span></a></div>
    </section>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>("English");
  const [ageBand, setAgeBand] = useState<AgeBand>("adult");
  const [ageInMonths, setAgeInMonths] = useState("0");
  const [selectedSignals, setSelectedSignals] = useState<SymptomSignal[]>([]);
  const [started, setStarted] = useState(false);
  const t = (key: string) => copy[language][key] ?? copy.English[key] ?? key;

  const facts: TriageFacts = useMemo(() => ({
    schemaVersion: "1.0.0",
    language: languageToCode[language],
    ageBand,
    ...(ageBand === "infant" && ageInMonths.trim() !== "" ? { ageInMonths: Number(ageInMonths) } : {}),
    observations: selectedSignals.map((signal) => ({ signal, status: "present", provenance: "user_reported" })),
  }), [ageBand, ageInMonths, language, selectedSignals]);
  const assessment = evaluateRedFlags(facts);
  const hasEmergency = assessment.triggeredRuleIds.length > 0;
  const toggleSignal = (signal: SymptomSignal) => {
    setStarted(true);
    setSelectedSignals((current) => current.includes(signal) ? current.filter((item) => item !== signal) : [...current, signal]);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="LifeSafe home"><span className="wordmark-mark"><LineIcon name="shield" /></span><span>LifeSafe</span></a>
        <div className="topbar-tools"><span className="prototype-tag">{t("prototype")}</span><label className="language-control">{t("language")}<select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t("language")}>{(Object.keys(copy) as Language[]).map((option) => <option key={option} value={option}>{option}</option>)}</select><LineIcon name="chevron" /></label></div>
      </header>

      <div className="content-wrap">
        <EmergencyActions t={t} />
        <section className="intro" aria-labelledby="page-title"><div className="intro-kicker">{t("introKicker")}</div><h1 id="page-title">{t("title")}</h1><p>{t("intro")}</p></section>

        <div className="workspace">
          <section className="panel intake-panel" aria-labelledby="intake-heading">
            <div className="panel-heading"><div><span className="step-number">01</span><div><p className="eyebrow">{t("step1")}</p><h2 id="intake-heading">{t("what")}</h2></div></div><span className="panel-note">{t("noAccount")}</span></div>
            <p className="panel-lede">{t("lede")}</p>
            <div className="concern-list">
              {concernDefinitions.map(([signal, labelKey, detailKey]) => {
                const selected = selectedSignals.includes(signal);
                return <button key={signal} type="button" className={`concern-row${selected ? " is-selected" : ""}`} onClick={() => toggleSignal(signal)} aria-pressed={selected}><span className="concern-marker">{selected ? "✓" : <LineIcon name="plus" />}</span><span><strong>{t(labelKey)}</strong><small>{t(detailKey)}</small></span><LineIcon name="arrow" /></button>;
              })}
            </div>
          </section>

          <aside className="side-column">
            <section className={`panel result-panel${hasEmergency ? " result-panel-alert" : ""}`} aria-live="polite">
              <div className="panel-heading compact"><div><span className="step-number">02</span><div><p className="eyebrow">{t("step2")}</p><h2>{started ? (hasEmergency ? t("callNow") : t("notEnough")) : t("ready")}</h2></div></div></div>
              {!started && <p className="result-copy">{t("startCopy")}</p>}
              {started && hasEmergency && <><div className="result-banner"><span className="result-mark">!</span><div><strong>{t("emergencyHeading")}</strong><span>{t("emergencyCopy")}</span></div></div><div className="trigger-list"><p className="eyebrow">{t("selected")}</p>{selectedSignals.map((signal) => { const concern = concernDefinitions.find(([candidate]) => candidate === signal); return <span key={signal} className="trigger-item">{concern ? t(concern[1]) : signal}</span>; })}</div><a className="full-call" href="tel:112"><LineIcon name="phone" /> {t("call112")} <span>→</span></a></>}
              {started && !hasEmergency && <><p className="result-copy">{t("uncertainCopy")}</p><button className="secondary-action" onClick={() => { setStarted(false); setSelectedSignals([]); }} type="button">{t("review")} <LineIcon name="arrow" /></button></>}
            </section>

            <section className="panel details-panel" aria-labelledby="details-heading">
              <div className="panel-heading compact"><div><span className="step-number">03</span><div><p className="eyebrow">{t("step3")}</p><h2 id="details-heading">{t("who")}</h2></div></div></div>
              <div className="age-grid">
                {([{ value: "adult", label: t("adult") }, { value: "child", label: t("child") }, { value: "infant", label: t("infant") }, { value: "unknown", label: t("unknown") }] as { value: AgeBand; label: string }[]).map((option) => <button key={option.value} type="button" className={`age-option${ageBand === option.value ? " is-selected" : ""}`} onClick={() => setAgeBand(option.value)} aria-pressed={ageBand === option.value}>{option.label}</button>)}
              </div>
              {ageBand === "infant" && <label className="infant-age">{t("ageMonths")}<input type="number" min="0" max="36" step="1" value={ageInMonths} onChange={(event) => setAgeInMonths(event.target.value)} /></label>}
              <div className="privacy-note"><LineIcon name="shield" /><span><strong>{t("privacy")}</strong><small>{t("privacyCopy")}</small></span></div>
            </section>
          </aside>
        </div>

        <footer className="footer-note"><span><LineIcon name="shield" /> {t("draft")}</span><span>{t("footer")}</span></footer>
      </div>
    </main>
  );
}

export default App;

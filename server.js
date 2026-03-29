const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/kufumatch.html');
});

// SQLite Database
const db = new sqlite3.Database('./kufumatch.db', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// Create tables if not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      gender TEXT NOT NULL,
      answers TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
  });
});

// Questions data (same as frontend)
const QS = [
// BASIC
{id:'name',s:'basic',g:'both',t:{en:'Your Full Name',bn:'আপনার পুরো নাম'},type:'text'},
{id:'age',s:'basic',g:'both',t:{en:'Your Age',bn:'আপনার বয়স'},type:'number'},
{id:'height',s:'basic',g:'both',t:{en:'Height (cm)',bn:'উচ্চতা (সেমি)'},type:'number'},
{id:'edu',s:'basic',g:'both',t:{en:'Education Level',bn:'শিক্ষাগত যোগ্যতা'},type:'single',
 opts:[{v:'ssc',en:'SSC or below',bn:'এসএসসি বা নিচে',sc:1},{v:'hsc',en:'HSC',bn:'এইচএসসি',sc:2},{v:'diploma',en:'Diploma',bn:'ডিপ্লোমা',sc:2},{v:'bach',en:"Bachelor's",bn:'স্নাতক',sc:3},{v:'master',en:"Master's or above",bn:'স্নাতকোত্তর বা উপরে',sc:4}]},
{id:'occ',s:'basic',g:'both',t:{en:'Occupation / Profession',bn:'পেশা'},type:'text'},
{id:'loc',s:'basic',g:'both',t:{en:'City / District',bn:'শহর / জেলা'},type:'text'},
{id:'marital',s:'basic',g:'both',t:{en:'Marital Status',bn:'বৈবাহিক অবস্থা'},type:'single',
 opts:[{v:'s',en:'Single (Never Married)',bn:'অবিবাহিত',sc:3},{v:'d',en:'Divorced',bn:'তালাকপ্রাপ্ত',sc:2},{v:'w',en:'Widowed',bn:'বিধবা/বিপত্নীক',sc:2}]},

// DEEN
{id:'salah',s:'deen',g:'both',t:{en:'How regularly do you perform Salah (5 daily prayers)?',bn:'আপনি কতটা নিয়মিত ৫ ওয়াক্ত নামাজ পড়েন?'},type:'single',
 opts:[{v:'a',en:'All 5 times daily without fail',bn:'প্রতিদিন ৫ ওয়াক্ত — কখনো ছাড়ি না',sc:4},{v:'b',en:'Mostly 5 times (rarely miss)',bn:'বেশিরভাগ ৫ ওয়াক্ত — খুব কম ছাড়ি',sc:3},{v:'c',en:'Some prayers regularly',bn:'কিছু ওয়াক্ত নিয়মিত',sc:2},{v:'d',en:'Only Jummah / Eid',bn:'শুধু জুমা / ঈদ',sc:1},{v:'e',en:'Rarely / Not at all',bn:'খুব কম / একদম না',sc:0}]},
{id:'fasting',s:'deen',g:'both',t:{en:'Do you observe Ramadan fasting?',bn:'আপনি কি রমজানে রোজা রাখেন?'},type:'single',
 opts:[{v:'a',en:'All 29-30 fasts',bn:'সব ২৯-৩০টি রোজা',sc:4},{v:'b',en:'Most fasts',bn:'বেশিরভাগ রোজা',sc:3},{v:'c',en:'Some fasts',bn:'কিছু রোজা',sc:2},{v:'d',en:'Rarely',bn:'খুব কম',sc:1}]},
{id:'quran',s:'deen',g:'both',t:{en:'How regularly do you recite the Quran?',bn:'কতটা নিয়মিত কুরআন তেলাওয়াত করেন?'},type:'single',
 opts:[{v:'a',en:'Daily (even a few verses)',bn:'প্রতিদিন (কয়েক আয়াত হলেও)',sc:4},{v:'b',en:'Several times a week',bn:'সপ্তাহে কয়েকবার',sc:3},{v:'c',en:'Occasionally',bn:'মাঝে মাঝে',sc:2},{v:'d',en:'Rarely',bn:'খুব কম',sc:1}]},
{id:'dress_m',s:'deen',g:'male',t:{en:'Do you follow Islamic dress code (cover awrah, avoid tight/revealing clothes)?',bn:'আপনি কি ইসলামিক পোশাকবিধি মেনে চলেন?'},type:'single',
 opts:[{v:'a',en:'Yes, strictly always',bn:'হ্যাঁ, সবসময় কঠোরভাবে',sc:4},{v:'b',en:'Mostly yes',bn:'বেশিরভাগ সময় হ্যাঁ',sc:3},{v:'c',en:'Sometimes',bn:'মাঝে মাঝে',sc:2},{v:'d',en:'Not really',bn:'তেমন না',sc:1}]},
{id:'hijab',s:'deen',g:'female',t:{en:'Do you observe Hijab / Islamic dress code (purdah)?',bn:'আপনি কি হিজাব / পর্দা পালন করেন?'},type:'single',
 opts:[{v:'a',en:'Full purdah strictly',bn:'পূর্ণ পর্দা কঠোরভাবে',sc:4},{v:'b',en:'Regular hijab',bn:'নিয়মিত হিজাব',sc:3},{v:'c',en:'Partial / trying',bn:'আংশিক / চেষ্টা করছি',sc:2},{v:'d',en:'Not observing currently',bn:'এখন পালন করি না',sc:1}]},
{id:'deen_imp',s:'deen',g:'both',t:{en:'How important is Deen in your life?',bn:'আপনার জীবনে দ্বীন কতটা গুরুত্বপূর্ণ?'},type:'single',
 opts:[{v:'a',en:'Highest priority — guides every decision',bn:'সর্বোচ্চ — প্রতিটি সিদ্ধান্ত পরিচালিত করে',sc:4},{v:'b',en:'Very important',bn:'অনেক গুরুত্বপূর্ণ',sc:3},{v:'c',en:'Moderately important',bn:'মোটামুটি গুরুত্বপূর্ণ',sc:2},{v:'d',en:'Not a major priority',bn:'প্রধান অগ্রাধিকার নয়',sc:1}]},
{id:'spouse_deen',s:'deen',g:'both',t:{en:'What do you expect from your spouse regarding Deen?',bn:'জীবনসঙ্গীর দ্বীন সম্পর্কে আপনার প্রত্যাশা?'},type:'single',
 opts:[{v:'a',en:'Must be very practicing',bn:'অবশ্যই অনেক আমলদার',sc:4},{v:'b',en:'Should be practicing',bn:'আমলদার হওয়া উচিত',sc:3},{v:'c',en:'Moderately religious is fine',bn:'মোটামুটি ধার্মিক হলেই চলবে',sc:2},{v:'d',en:'No strong expectation',bn:'বিশেষ প্রত্যাশা নেই',sc:1}]},
{id:'haram',s:'deen',g:'both',t:{en:'How conscious are you about avoiding Haram (forbidden things)?',bn:'হারাম থেকে বিরত থাকার ব্যাপারে কতটা সচেতন?'},type:'single',
 opts:[{v:'a',en:'Very strict — avoid all haram',bn:'অনেক কঠোর — সব হারাম এড়াই',sc:4},{v:'b',en:'Mostly conscious',bn:'বেশিরভাগ সচেতন',sc:3},{v:'c',en:'Somewhat conscious',bn:'কিছুটা সচেতন',sc:2},{v:'d',en:'Not very strict',bn:'বিশেষ কঠোর নই',sc:1}]},
{id:'islamic_know',s:'deen',g:'both',t:{en:'How is your Islamic knowledge (Fiqh, Quran, Hadith)?',bn:'আপনার ইসলামিক জ্ঞান কেমন (ফিকহ, কুরআন, হাদিস)?'},type:'single',
 opts:[{v:'a',en:'Good — regularly study Islam',bn:'ভালো — নিয়মিত ইসলাম চর্চা করি',sc:4},{v:'b',en:'Moderate',bn:'মোটামুটি',sc:3},{v:'c',en:'Basic knowledge',bn:'মৌলিক জ্ঞান',sc:2},{v:'d',en:'Minimal',bn:'সামান্য',sc:1}]},

// CHARACTER
{id:'anger',s:'character',g:'both',t:{en:'How do you handle anger?',bn:'আপনি রাগ কীভাবে নিয়ন্ত্রণ করেন?'},type:'single',
 opts:[{v:'a',en:'Very controlled — calm down quickly',bn:'অনেক নিয়ন্ত্রিত — দ্রুত শান্ত হই',sc:4},{v:'b',en:'Mostly controlled',bn:'বেশিরভাগ নিয়ন্ত্রিত',sc:3},{v:'c',en:'Sometimes lose control',bn:'মাঝে মাঝে নিয়ন্ত্রণ হারাই',sc:2},{v:'d',en:'Often gets intense',bn:'প্রায়ই তীব্র হয়ে যায়',sc:1}]},
{id:'honesty',s:'character',g:'both',t:{en:'How honest are you in difficult situations?',bn:'কঠিন পরিস্থিতিতে আপনি কতটা সৎ?'},type:'single',
 opts:[{v:'a',en:'Always honest, even if painful',bn:'সবসময় সৎ, কষ্টদায়ক হলেও',sc:4},{v:'b',en:'Mostly honest',bn:'বেশিরভাগ সৎ',sc:3},{v:'c',en:'Sometimes avoid hard truths',bn:'মাঝে মাঝে কঠিন সত্য এড়াই',sc:2},{v:'d',en:'Prefer white lies to avoid conflict',bn:'দ্বন্দ্ব এড়াতে ছোট মিথ্যা বলি',sc:1}]},
{id:'patience',s:'character',g:'both',t:{en:'How patient are you in conflicts?',bn:'দ্বন্দ্বে আপনি কতটা ধৈর্যশীল?'},type:'single',
 opts:[{v:'a',en:'Very patient',bn:'অনেক ধৈর্যশীল',sc:4},{v:'b',en:'Moderately patient',bn:'মোটামুটি ধৈর্যশীল',sc:3},{v:'c',en:'Sometimes impatient',bn:'মাঝে মাঝে অধৈর্য',sc:2},{v:'d',en:'Often impatient',bn:'প্রায়ই অধৈর্য',sc:1}]},
{id:'decision',s:'character',g:'both',t:{en:'Your decision-making style in marriage?',bn:'বিবাহে সিদ্ধান্ত নেওয়ার ধরন?'},type:'single',
 opts:[{v:'a',en:'Joint decisions always',bn:'সবসময় যৌথ সিদ্ধান্ত',sc:4},{v:'b',en:'Consult then decide together',bn:'পরামর্শ করে একসাথে সিদ্ধান্ত',sc:4},{v:'c',en:'Mostly individual',bn:'বেশিরভাগ ব্যক্তিগতভাবে',sc:2},{v:'d',en:'Family decides',bn:'পরিবার সিদ্ধান্ত নেয়',sc:2}]},
{id:'forgiveness',s:'character',g:'both',t:{en:'How easily do you forgive others?',bn:'আপনি কতটা সহজে অন্যদের ক্ষমা করেন?'},type:'single',
 opts:[{v:'a',en:'Easily forgive and move on',bn:'সহজে ক্ষমা করি এবং এগিয়ে যাই',sc:4},{v:'b',en:'Forgive but takes time',bn:'ক্ষমা করি তবে সময় লাগে',sc:3},{v:'c',en:'Difficult to forgive',bn:'ক্ষমা করা কঠিন',sc:2},{v:'d',en:'Rarely forgive fully',bn:'সম্পূর্ণ ক্ষমা করি খুব কম',sc:1}]},
{id:'empathy',s:'character',g:'both',t:{en:'How empathetic are you toward others feelings?',bn:'অন্যের অনুভূতির প্রতি আপনি কতটা সহানুভূতিশীল?'},type:'single',
 opts:[{v:'a',en:'Highly empathetic',bn:'অনেক বেশি সহানুভূতিশীল',sc:4},{v:'b',en:'Moderately empathetic',bn:'মোটামুটি সহানুভূতিশীল',sc:3},{v:'c',en:'Sometimes',bn:'মাঝে মাঝে',sc:2},{v:'d',en:'Not very empathetic',bn:'বিশেষ সহানুভূতিশীল নই',sc:1}]},
{id:'personality',s:'character',g:'both',t:{en:'Your personality type?',bn:'আপনার ব্যক্তিত্ব কেমন?'},type:'single',
 opts:[{v:'a',en:'Very extroverted',bn:'অনেক বহির্মুখী',sc:3},{v:'b',en:'Balanced (Ambivert)',bn:'মিশ্র (অ্যাম্বিভার্ট)',sc:4},{v:'c',en:'Mostly introverted',bn:'বেশিরভাগ অন্তর্মুখী',sc:3},{v:'d',en:'Very introverted',bn:'অনেক অন্তর্মুখী',sc:2}]},
{id:'ego',s:'character',g:'both',t:{en:'Can you accept being wrong and apologize?',bn:'আপনি কি নিজের ভুল স্বীকার করে ক্ষমা চাইতে পারেন?'},type:'single',
 opts:[{v:'a',en:'Yes, easily and willingly',bn:'হ্যাঁ, সহজে এবং স্বেচ্ছায়',sc:4},{v:'b',en:'Yes, but takes some courage',bn:'হ্যাঁ, তবে একটু কঠিন',sc:3},{v:'c',en:'Rarely — hard for me',bn:'কমই — আমার জন্য কঠিন',sc:2},{v:'d',en:'Almost never',bn:'প্রায় কখনো না',sc:1}]},

// FAMILY
{id:'fam_sys',s:'family',g:'both',t:{en:'Preferred family system after marriage?',bn:'বিয়ের পর পছন্দের পারিবারিক ব্যবস্থা?'},type:'single',
 opts:[{v:'a',en:'Joint family',bn:'যৌথ পরিবার',sc:3},{v:'b',en:'Nuclear family',bn:'একক পরিবার',sc:3},{v:'c',en:'Near parents but separate home',bn:'বাবা-মার কাছে কিন্তু আলাদা বাড়ি',sc:4},{v:'d',en:'Flexible — situation-dependent',bn:'নমনীয় — পরিস্থিতি অনুযায়ী',sc:4}]},
{id:'inlaws',s:'family',g:'both',t:{en:'Your sense of responsibility toward in-laws?',bn:'শ্বশুর-শাশুড়ির প্রতি দায়িত্ববোধ?'},type:'single',
 opts:[{v:'a',en:'High — they are my family',bn:'অনেক — তারাও আমার পরিবার',sc:4},{v:'b',en:'Respectful with boundaries',bn:'সম্মানজনক কিন্তু সীমানা সহ',sc:3},{v:'c',en:'Moderate',bn:'মাঝারি',sc:2},{v:'d',en:'Minimal — spouse comes first',bn:'কম — সঙ্গী সবসময় আগে',sc:1}]},
{id:'fam_role',s:'family',g:'both',t:{en:'Role of family in your major decisions?',bn:'গুরুত্বপূর্ণ সিদ্ধান্তে পরিবারের ভূমিকা?'},type:'single',
 opts:[{v:'a',en:'High — family opinion is paramount',bn:'অনেক — পরিবারের মত সর্বোচ্চ',sc:3},{v:'b',en:'Moderate — consult then decide',bn:'মাঝারি — পরামর্শ নিয়ে নিজে সিদ্ধান্ত',sc:4},{v:'c',en:'Low — mostly independent',bn:'কম — বেশিরভাগ স্বাধীন',sc:2}]},
{id:'children',s:'family',g:'both',t:{en:'How many children do you prefer?',bn:'আপনি কতজন সন্তান চান?'},type:'single',
 opts:[{v:'a',en:'1–2 children',bn:'১–২ সন্তান',sc:3},{v:'b',en:'3–4 children',bn:'৩–৪ সন্তান',sc:3},{v:'c',en:'4+ (large family)',bn:'৪+ (বড় পরিবার)',sc:2},{v:'d',en:'Allah decides / no preference',bn:'আল্লাহ নির্ধারণ করবেন / কোনো পছন্দ নেই',sc:4}]},
{id:'parenting',s:'family',g:'both',t:{en:'How do you want to raise children?',bn:'সন্তান কীভাবে মানুষ করতে চান?'},type:'single',
 opts:[{v:'a',en:'Islamic values + modern education',bn:'ইসলামিক মূল্যবোধ + আধুনিক শিক্ষা',sc:4},{v:'b',en:'Strictly Islamic environment',bn:'সম্পূর্ণ ইসলামিক পরিবেশে',sc:3},{v:'c',en:'Modern with some Islamic values',bn:'আধুনিক পদ্ধতিতে কিছু ইসলামিক মূল্যবোধ',sc:3},{v:'d',en:'Let them choose as they grow',bn:'বড় হলে তারাই বেছে নেবে',sc:1}]},
{id:'parents_care',s:'family',g:'both',t:{en:'Are you willing to take care of your parents in old age?',bn:'বৃদ্ধ বয়সে নিজের বাবা-মার সেবা করতে প্রস্তুত?'},type:'single',
 opts:[{v:'a',en:'Absolutely — Islamic duty',bn:'অবশ্যই — ইসলামিক দায়িত্ব',sc:4},{v:'b',en:'Yes, will do my best',bn:'হ্যাঁ, সাধ্যমতো করব',sc:3},{v:'c',en:'Depends on circumstances',bn:'পরিস্থিতির উপর নির্ভর করে',sc:2},{v:'d',en:'Prefer to keep separate',bn:'আলাদা রাখতে পছন্দ',sc:1}]},
{id:'family_planning',s:'family',g:'both',t:{en:'Importance of family planning (Tarbiyah)?',bn:'পরিবার পরিকল্পনা ও তারবিয়াহর গুরুত্ব?'},type:'single',
 opts:[{v:'a',en:'Very important — planned approach',bn:'অনেক গুরুত্বপূর্ণ — পরিকল্পিতভাবে',sc:4},{v:'b',en:'Important',bn:'গুরুত্বপূর্ণ',sc:3},{v:'c',en:'Moderate',bn:'মাঝারি',sc:2},{v:'d',en:'Not a priority',bn:'প্রাধান্য নয়',sc:1}]},

// FINANCE - MALE
{id:'income',s:'finance',g:'male',t:{en:'Your monthly income (BDT)?',bn:'আপনার মাসিক আয় (টাকা)?'},type:'single',
 opts:[{v:'a',en:'Less than 15,000',bn:'১৫,০০০ এর কম',sc:1},{v:'b',en:'15,000 – 30,000',bn:'১৫,০০০ – ৩০,০০০',sc:2},{v:'c',en:'30,000 – 60,000',bn:'৩০,০০০ – ৬০,০০০',sc:3},{v:'d',en:'60,000 – 1,00,000',bn:'৬০,০০০ – ১,০০,০০০',sc:4},{v:'e',en:'1,00,000+',bn:'১,০০,০০০+',sc:5}]},
{id:'stability',s:'finance',g:'male',t:{en:'Your financial stability?',bn:'আপনার আর্থিক স্থিতিশীলতা?'},type:'single',
 opts:[{v:'a',en:'Stable — fixed income / business',bn:'স্থিতিশীল — নির্দিষ্ট আয় / ব্যবসা',sc:4},{v:'b',en:'Moderately stable',bn:'মোটামুটি স্থিতিশীল',sc:3},{v:'c',en:'Currently building',bn:'এখন গড়ে তুলছি',sc:2},{v:'d',en:'Unstable / irregular',bn:'অস্থিতিশীল / অনিয়মিত',sc:1}]},
{id:'expenses',s:'finance',g:'male',t:{en:'Can you fully bear family expenses?',bn:'পারিবারিক সম্পূর্ণ খরচ বহন করতে পারবেন?'},type:'single',
 opts:[{v:'a',en:'Yes, fully capable',bn:'হ্যাঁ, সম্পূর্ণভাবে সক্ষম',sc:4},{v:'b',en:'Mostly — wife can contribute if willing',bn:'বেশিরভাগ — স্ত্রী ইচ্ছায় সহযোগিতা করতে পারে',sc:3},{v:'c',en:'Need shared income',bn:'যৌথ আয়ের প্রয়োজন',sc:2},{v:'d',en:'Still growing financially',bn:'আর্থিকভাবে এখনো বাড়ছি',sc:1}]},
{id:'savings_m',s:'finance',g:'male',t:{en:'Do you have savings or assets?',bn:'আপনার কি সঞ্চয় বা সম্পদ আছে?'},type:'single',
 opts:[{v:'a',en:'Significant savings + property',bn:'উল্লেখযোগ্য সঞ্চয় + সম্পত্তি',sc:4},{v:'b',en:'Some savings',bn:'কিছু সঞ্চয়',sc:3},{v:'c',en:'Minimal savings',bn:'সামান্য সঞ্চয়',sc:2},{v:'d',en:'No savings currently',bn:'এখন কোনো সঞ্চয় নেই',sc:1}]},
{id:'debt_m',s:'finance',g:'male',t:{en:'Do you have significant debts or loans?',bn:'কি উল্লেখযোগ্য ঋণ বা লোন আছে?'},type:'single',
 opts:[{v:'a',en:'No debts at all',bn:'কোনো ঋণ নেই',sc:4},{v:'b',en:'Small manageable debt',bn:'ছোট নিয়ন্ত্রণযোগ্য ঋণ',sc:3},{v:'c',en:'Significant debt repaying',bn:'উল্লেখযোগ্য ঋণ পরিশোধ হচ্ছে',sc:2},{v:'d',en:'Heavy debt burden',bn:'ভারী ঋণের বোঝা',sc:1}]},

// FINANCE - FEMALE
{id:'fam_finance',s:'finance',g:'female',t:{en:"Your family's financial status?",bn:'আপনার পরিবারের আর্থিক অবস্থা?'},type:'single',
 opts:[{v:'a',en:'Lower class',bn:'নিম্নবিত্ত',sc:1},{v:'b',en:'Lower middle class',bn:'নিম্ন মধ্যবিত্ত',sc:2},{v:'c',en:'Middle class',bn:'মধ্যবিত্ত',sc:3},{v:'d',en:'Upper middle class',bn:'উচ্চ মধ্যবিত্ত',sc:4},{v:'e',en:'Upper class / wealthy',bn:'উচ্চবিত্ত / ধনী',sc:5}]},
{id:'income_exp',s:'finance',g:'female',t:{en:"Income expectation from husband?",bn:'স্বামীর আয়ের ব্যাপারে প্রত্যাশা?'},type:'single',
 opts:[{v:'a',en:'High — comfortable lifestyle essential',bn:'বেশি — আরামদায়ক জীবন জরুরি',sc:2},{v:'b',en:'Moderate — enough for family',bn:'মাঝারি — পরিবারের জন্য যথেষ্ট',sc:4},{v:'c',en:'Basic needs covered is fine',bn:'মৌলিক চাহিদা পূরণ হলেই চলবে',sc:3},{v:'d',en:'I can also contribute financially',bn:'আমিও আর্থিকভাবে সহযোগিতা করব',sc:4}]},
{id:'mahr',s:'finance',g:'female',t:{en:"Mahr expectation?",bn:'মোহরানার প্রত্যাশা?'},type:'single',
 opts:[{v:'a',en:'Symbolic amount (Islamic spirit)',bn:'প্রতীকী পরিমাণ (ইসলামিক চেতনায়)',sc:4},{v:'b',en:'Moderate and reasonable',bn:'মাঝারি ও যুক্তিসংগত',sc:3},{v:'c',en:'Substantial amount',bn:'উল্লেখযোগ্য পরিমাণ',sc:2},{v:'d',en:'Open to discussion',bn:'আলোচনার জন্য উন্মুক্ত',sc:4}]},
{id:'savings_f',s:'finance',g:'female',t:{en:'Do you have personal savings or assets?',bn:'আপনার ব্যক্তিগত সঞ্চয় বা সম্পদ আছে?'},type:'single',
 opts:[{v:'a',en:'Yes — significant',bn:'হ্যাঁ — উল্লেখযোগ্য',sc:4},{v:'b',en:'Some savings',bn:'কিছু সঞ্চয়',sc:3},{v:'c',en:'Minimal',bn:'সামান্য',sc:2},{v:'d',en:'No personal savings',bn:'ব্যক্তিগত সঞ্চয় নেই',sc:1}]},

// EDUCATION & CAREER
{id:'career_goal',s:'education',g:'both',t:{en:'Your career goals?',bn:'আপনার পেশাদার লক্ষ্য?'},type:'single',
 opts:[{v:'a',en:'High ambition — senior position / own business',bn:'উচ্চ উচ্চাকাঙ্ক্ষা — উচ্চপদ / নিজস্ব ব্যবসা',sc:3},{v:'b',en:'Stable career with work-life balance',bn:'কাজ-জীবন ভারসাম্য সহ স্থিতিশীল পেশা',sc:4},{v:'c',en:'Family first — career secondary',bn:'পরিবার আগে — পেশা পরে',sc:3},{v:'d',en:'Focus on home and family',bn:'ঘর ও পরিবারে মনোযোগ',sc:2}]},
{id:'work_after_f',s:'education',g:'female',t:{en:'Do you plan to work after marriage?',bn:'বিয়ের পর কাজ/ব্যবসার পরিকল্পনা আছে?'},type:'single',
 opts:[{v:'a',en:'Yes — continue career definitely',bn:'হ্যাঁ — পেশা অবশ্যই চালিয়ে যাব',sc:3},{v:'b',en:'Yes — if husband agrees',bn:'হ্যাঁ — স্বামী রাজি হলে',sc:4},{v:'c',en:'Prefer to stay home',bn:'ঘরে থাকতে পছন্দ করব',sc:3},{v:'d',en:'Work from home only',bn:'শুধু বাড়ি থেকে কাজ',sc:3},{v:'e',en:'Open to both',bn:'উভয়ের জন্য উন্মুক্ত',sc:4}]},
{id:'wife_work_m',s:'education',g:'male',t:{en:"Your preference for wife's career after marriage?",bn:'বিয়ের পর স্ত্রীর পেশা সম্পর্কে পছন্দ?'},type:'single',
 opts:[{v:'a',en:'Prefer wife to stay home',bn:'স্ত্রী ঘরে থাকুক পছন্দ',sc:2},{v:'b',en:'Her choice — fully supportive',bn:'তার পছন্দ — সম্পূর্ণ সহযোগী',sc:4},{v:'c',en:'Want her to work and contribute',bn:'চাই সে কাজ করুক এবং সহযোগিতা করতে',sc:3},{v:'d',en:'Flexible based on family needs',bn:'পারিবারিক প্রয়োজনে নমনীয়',sc:4}]},
{id:'edu_pref',s:'education',g:'both',t:{en:'Preferred education level for your spouse?',bn:'জীবনসঙ্গীর শিক্ষাগত যোগ্যতার পছন্দ?'},type:'single',
 opts:[{v:'a',en:'Must be highly educated (Masters+)',bn:'অবশ্যই উচ্চশিক্ষিত (স্নাতকোত্তর+)',sc:2},{v:'b',en:'Graduate level or above',bn:'স্নাতক বা উপরে',sc:3},{v:'c',en:'Educated enough for household',bn:'সংসারের জন্য যথেষ্ট শিক্ষিত',sc:3},{v:'d',en:'Education level not a major factor',bn:'শিক্ষার স্তর বড় বিষয় নয়',sc:2}]},

// RELATIONSHIP
{id:'most_imp',s:'relationship',g:'both',t:{en:'Most important factor in a successful marriage?',bn:'সফল বিবাহের সবচেয়ে গুরুত্বপূর্ণ উপাদান?'},type:'single',
 opts:[{v:'a',en:'Deen and Taqwa above all',bn:'সর্বোপরি দ্বীন ও তাকওয়া',sc:4},{v:'b',en:'Mutual love and respect',bn:'পারস্পরিক ভালোবাসা ও সম্মান',sc:4},{v:'c',en:'Financial security',bn:'আর্থিক নিরাপত্তা',sc:2},{v:'d',en:'Family acceptance and harmony',bn:'পারিবারিক গ্রহণযোগ্যতা ও সম্প্রীতি',sc:3},{v:'e',en:'All of the above equally',bn:'সবকটি সমানভাবে',sc:4}]},
{id:'conflict_res',s:'relationship',g:'both',t:{en:'How do you resolve conflicts in relationships?',bn:'সম্পর্কে দ্বন্দ্ব কীভাবে সমাধান করেন?'},type:'single',
 opts:[{v:'a',en:'Calm discussion immediately',bn:'শান্তভাবে তাৎক্ষণিক আলোচনা',sc:4},{v:'b',en:'Give time then talk calmly',bn:'সময় দিয়ে শান্তভাবে কথা বলি',sc:3},{v:'c',en:'Involve trusted family / counselor',bn:'বিশ্বস্ত পরিবার / পরামর্শদাতাকে যুক্ত করি',sc:3},{v:'d',en:'Avoid conflict / silent treatment',bn:'দ্বন্দ্ব এড়াই / নীরব থাকি',sc:1}]},
{id:'communication',s:'relationship',g:'both',t:{en:'Preferred communication style in marriage?',bn:'বিবাহে পছন্দের যোগাযোগ ধরন?'},type:'single',
 opts:[{v:'a',en:'Very open — share everything',bn:'অনেক খোলামেলা — সবকিছু শেয়ার করি',sc:4},{v:'b',en:'Moderate — share important things',bn:'মাঝারি — গুরুত্বপূর্ণ বিষয় শেয়ার',sc:3},{v:'c',en:'Selective — some privacy',bn:'বাছাই করা — কিছু ব্যক্তিগত',sc:2}]},
{id:'romance',s:'relationship',g:'both',t:{en:'Importance of affection and romance in marriage?',bn:'বিবাহে স্নেহ ও ভালোবাসার গুরুত্ব?'},type:'single',
 opts:[{v:'a',en:'Very important — actively express love',bn:'অনেক গুরুত্বপূর্ণ — সক্রিয়ভাবে ভালোবাসা প্রকাশ করি',sc:3},{v:'b',en:'Important but not dominant',bn:'গুরুত্বপূর্ণ কিন্তু প্রধান নয়',sc:4},{v:'c',en:'Moderate',bn:'মাঝারি',sc:3},{v:'d',en:'Actions over words',bn:'কথার চেয়ে কাজে বিশ্বাসী',sc:2}]},
{id:'quality_time',s:'relationship',g:'both',t:{en:'How much quality time should couples spend together?',bn:'দম্পতির কতটা মানসম্পন্ন সময় একসাথে কাটানো উচিত?'},type:'single',
 opts:[{v:'a',en:'As much as possible',bn:'যতটা সম্ভব',sc:3},{v:'b',en:'Several quality hours daily',bn:'প্রতিদিন কয়েক ঘণ্টা মানসম্পন্ন সময়',sc:4},{v:'c',en:'Quality over quantity',bn:'পরিমাণের চেয়ে মান বেশি গুরুত্বপূর্ণ',sc:3},{v:'d',en:'Individual space is important',bn:'ব্যক্তিগত স্থান গুরুত্বপূর্ণ',sc:2}]},
{id:'respect_spouse',s:'relationship',g:'both',t:{en:'How do you view the Islamic roles of husband and wife?',bn:'স্বামী-স্ত্রীর ইসলামিক ভূমিকা সম্পর্কে আপনার দৃষ্টিভঙ্গি?'},type:'single',
 opts:[{v:'a',en:'Follow Islamic roles strictly',bn:'ইসলামিক ভূমিকা কঠোরভাবে পালন করি',sc:4},{v:'b',en:'Follow Islamic roles with flexibility',bn:'নমনীয়তার সাথে ইসলামিক ভূমিকা',sc:4},{v:'c',en:'Equal partnership in everything',bn:'সবকিছুতে সমান অংশীদারিত্ব',sc:2},{v:'d',en:'Roles depend on the couple',bn:'ভূমিকা দম্পতির উপর নির্ভর করে',sc:3}]},

// LIFESTYLE
{id:'social_media',s:'lifestyle',g:'both',t:{en:'Your social media usage?',bn:'আপনার সোশ্যাল মিডিয়া ব্যবহার?'},type:'single',
 opts:[{v:'a',en:'Very heavy — hours daily',bn:'অনেক বেশি — প্রতিদিন ঘণ্টার পর ঘণ্টা',sc:1},{v:'b',en:'Moderate — 1-2 hours daily',bn:'মাঝারি — প্রতিদিন ১-২ ঘণ্টা',sc:3},{v:'c',en:'Minimal — only when necessary',bn:'কম — শুধু প্রয়োজনে',sc:4},{v:'d',en:'Rarely use social media',bn:'সোশ্যাল মিডিয়া খুব কম ব্যবহার',sc:4}]},
{id:'entertainment',s:'lifestyle',g:'both',t:{en:'Entertainment preferences?',bn:'বিনোদনের পছন্দ?'},type:'single',
 opts:[{v:'a',en:'Islamic content, Quran, lectures',bn:'ইসলামিক কন্টেন্ট, কুরআন, লেকচার',sc:4},{v:'b',en:'Educational documentaries & books',bn:'শিক্ষামূলক ডকুমেন্টারি ও বই',sc:3},{v:'c',en:'Mix of halal entertainment',bn:'হালাল বিনোদনের মিশ্রণ',sc:2},{v:'d',en:'Movies, music, dramas freely',bn:'মুভি, মিউজিক, নাটক স্বাধীনভাবে',sc:1}]},
{id:'travel',s:'lifestyle',g:'both',t:{en:'Travel preferences?',bn:'ভ্রমণের পছন্দ?'},type:'single',
 opts:[{v:'a',en:'Love traveling — frequent domestic/international',bn:'ভ্রমণ ভালোবাসি — ঘন ঘন দেশে-বিদেশে',sc:3},{v:'b',en:'Occasional family trips',bn:'মাঝে মাঝে পারিবারিক সফর',sc:4},{v:'c',en:'Prefer religious travel (Hajj, Umrah)',bn:'ধর্মীয় সফর পছন্দ (হজ, উমরা)',sc:4},{v:'d',en:'Prefer staying home',bn:'ঘরে থাকতে পছন্দ',sc:2}]},
{id:'routine',s:'lifestyle',g:'both',t:{en:'Your daily routine style?',bn:'আপনার দৈনন্দিন রুটিন?'},type:'single',
 opts:[{v:'a',en:'Highly structured and disciplined',bn:'অনেক নিয়মতান্ত্রিক ও শৃঙ্খলাবদ্ধ',sc:4},{v:'b',en:'Moderately structured',bn:'মোটামুটি নিয়মতান্ত্রিক',sc:3},{v:'c',en:'Flexible — adapts to situation',bn:'নমনীয় — পরিস্থিতি অনুযায়ী',sc:2},{v:'d',en:'No fixed routine',bn:'কোনো নির্দিষ্ট রুটিন নেই',sc:1}]},
{id:'diet',s:'lifestyle',g:'both',t:{en:'Dietary habits?',bn:'খাদ্যাভ্যাস?'},type:'single',
 opts:[{v:'a',en:'Strictly halal only',bn:'শুধুমাত্র হালাল',sc:4},{v:'b',en:'Halal but not always strict',bn:'হালাল কিন্তু সবসময় কঠোর নই',sc:3},{v:'c',en:'Not strict about halal',bn:'হালাল নিয়ে কঠোর নই',sc:1}]},
{id:'finance_mgmt',s:'lifestyle',g:'both',t:{en:'How do you manage personal finances?',bn:'ব্যক্তিগত অর্থ কীভাবে পরিচালনা করেন?'},type:'single',
 opts:[{v:'a',en:'Very disciplined — save and plan',bn:'অনেক শৃঙ্খলাবদ্ধ — সঞ্চয় ও পরিকল্পনা করি',sc:4},{v:'b',en:'Mostly disciplined',bn:'বেশিরভাগ শৃঙ্খলাবদ্ধ',sc:3},{v:'c',en:'Moderate — sometimes overspend',bn:'মাঝারি — মাঝে মাঝে বেশি খরচ',sc:2},{v:'d',en:'Not very disciplined',bn:'বিশেষ শৃঙ্খলাবদ্ধ নই',sc:1}]},
{id:'health_lifestyle',s:'lifestyle',g:'both',t:{en:'How do you take care of your health?',bn:'আপনি কিভাবে স্বাস্থ্যের যত্ন নেন?'},type:'single',
 opts:[{v:'a',en:'Very conscious — exercise, good diet',bn:'অনেক সচেতন — ব্যায়াম, ভালো খাবার',sc:4},{v:'b',en:'Moderately health-conscious',bn:'মোটামুটি স্বাস্থ্য সচেতন',sc:3},{v:'c',en:'Not very concerned',bn:'বিশেষ উদ্বিগ্ন নই',sc:2}]},

// RED FLAGS
{id:'smoking',s:'redflags',g:'both',t:{en:'Do you smoke or use tobacco?',bn:'আপনি কি ধূমপান বা তামাক ব্যবহার করেন?'},type:'single',
 opts:[{v:'a',en:'No — never',bn:'না — কখনো না',sc:4},{v:'b',en:'Quit — trying to stop',bn:'ছেড়ে দিয়েছি / চেষ্টা করছি',sc:2},{v:'c',en:'Occasionally',bn:'মাঝে মাঝে',sc:1},{v:'d',en:'Yes, regularly',bn:'হ্যাঁ, নিয়মিত',sc:0}]},
{id:'addiction',s:'redflags',g:'both',t:{en:'Any addiction issues (drugs, gambling, etc.)?',bn:'কোনো আসক্তির সমস্যা (মাদক, জুয়া ইত্যাদি)?'},type:'single',
 opts:[{v:'a',en:'Absolutely not',bn:'একদমই না',sc:4},{v:'b',en:'Recovered from past issues',bn:'অতীতের সমস্যা থেকে সুস্থ হয়েছি',sc:2},{v:'c',en:'Minor issues',bn:'সামান্য সমস্যা',sc:1}]},
{id:'health_cond',s:'redflags',g:'both',t:{en:'Any major health conditions?',bn:'কোনো বড় স্বাস্থ্য সমস্যা?'},type:'single',
 opts:[{v:'a',en:'Alhamdulillah — healthy',bn:'আলহামদুলিল্লাহ — সুস্থ',sc:4},{v:'b',en:'Minor manageable conditions',bn:'সামান্য নিয়ন্ত্রণযোগ্য সমস্যা',sc:3},{v:'c',en:'Chronic but managed',bn:'দীর্ঘস্থায়ী কিন্তু নিয়ন্ত্রিত',sc:2},{v:'d',en:'Serious health condition',bn:'গুরুতর স্বাস্থ্য সমস্যা',sc:1}]},
{id:'past_rel',s:'redflags',g:'both',t:{en:'Previous relationship history?',bn:'পূর্বের সম্পর্কের ইতিহাস?'},type:'single',
 opts:[{v:'a',en:'No relationships before marriage',bn:'বিয়ের আগে কোনো সম্পর্ক নেই',sc:4},{v:'b',en:'Past but sincerely repented',bn:'অতীতে ছিল কিন্তু আন্তরিকভাবে তওবা',sc:3},{v:'c',en:'Prefer not to disclose',bn:'প্রকাশ করতে পছন্দ করি না',sc:1}]},
{id:'commitment',s:'redflags',g:'both',t:{en:'Your commitment level to marriage?',bn:'বিবাহের প্রতি আপনার প্রতিশ্রুতি?'},type:'single',
 opts:[{v:'a',en:'Lifelong — divorce is absolute last resort',bn:'আজীবনের — তালাক একেবারে শেষ পথ',sc:4},{v:'b',en:'Very strong commitment',bn:'অনেক শক্তিশালী প্রতিশ্রুতি',sc:3},{v:'c',en:'Committed but separation is possible',bn:'প্রতিশ্রুতিবদ্ধ কিন্তু বিচ্ছেদ সম্ভব',sc:2}]},
{id:'domestic',s:'redflags',g:'both',t:{en:'Do you believe in harsh treatment of spouse?',bn:'আপনি কি জীবনসঙ্গীর সাথে কঠোর আচরণে বিশ্বাস করেন?'},type:'single',
 opts:[{v:'a',en:'Never — kindness always',bn:'কখনো না — সবসময় সদয়তা',sc:4},{v:'b',en:'Sometimes stern but never harmful',bn:'মাঝে মাঝে কঠোর কিন্তু কখনো ক্ষতিকর নয়',sc:3},{v:'c',en:'Strong authority needed',bn:'শক্তিশালী কর্তৃত্ব প্রয়োজন',sc:1}]},
{id:'mismatch_tol',s:'redflags',g:'both',t:{en:'Tolerance for religious practice differences with spouse?',bn:'জীবনসঙ্গীর ধর্মীয় পার্থক্যের সহনশীলতা?'},type:'single',
 opts:[{v:'a',en:'Low — must be same practice level',bn:'কম — অবশ্যই একই মাত্রার আমলদার',sc:3},{v:'b',en:'Moderate — willing to guide/grow together',bn:'মাঝারি — একসাথে গাইড করতে/বাড়তে ইচ্ছুক',sc:4},{v:'c',en:'High — religion is personal',bn:'বেশি — ধর্ম সম্পূর্ণ ব্যক্তিগত',sc:1}]}
];

// API Endpoints

// Submit answers and generate code
app.post('/api/submit-answers', (req, res) => {
  const { gender, answers } = req.body;

  if (!gender || !answers) {
    return res.status(400).json({ error: 'Gender and answers are required' });
  }

  // Validate age and height if provided
  if (answers.age) {
    const age = parseInt(answers.age);
    if (isNaN(age) || age < 18 || age > 100) {
      return res.status(400).json({ error: 'Age must be between 18 and 100' });
    }
  }
  if (answers.height) {
    const height = parseInt(answers.height);
    if (isNaN(height) || height < 100 || height > 250) {
      return res.status(400).json({ error: 'Height must be between 100 and 250 cm' });
    }
  }

  let code;
  let attempts = 0;
  const maxAttempts = 10;

  const generateUniqueCode = () => {
    code = '';
    for (let i = 0; i < 12; i++) {
      code += Math.floor(Math.random() * 36).toString(36).toUpperCase();
    }
    return code;
  };

  const tryInsert = () => {
    code = generateUniqueCode();
    db.run('INSERT INTO users (code, gender, answers) VALUES (?, ?, ?)', 
      [code, gender, JSON.stringify(answers)], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT' && attempts < maxAttempts) {
            attempts++;
            tryInsert();
          } else {
            console.error('Error inserting user:', err);
            res.status(500).json({ error: 'Failed to save data' });
          }
        } else {
          res.json({ code });
        }
      });
  };

  tryInsert();
});

// Check compatibility
app.post('/api/check-match', (req, res) => {
  const { code1, code2 } = req.body;

  if (!code1 || !code2) {
    return res.status(400).json({ error: 'Both codes are required' });
  }

  db.all('SELECT * FROM users WHERE code IN (?, ?)', [code1, code2], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    if (rows.length !== 2) {
      return res.status(404).json({ error: 'One or both codes not found' });
    }

    const user1 = rows.find(u => u.code === code1);
    const user2 = rows.find(u => u.code === code2);

    if (user1.gender === user2.gender) {
      return res.status(400).json({ error: 'Codes must be from different genders' });
    }

    const answers1 = JSON.parse(user1.answers);
    const answers2 = JSON.parse(user2.answers);

    const compatibility = calculateCompatibility(answers1, answers2);

    res.json(compatibility);
  });
});

// Calculate compatibility score
function calculateCompatibility(answers1, answers2) {
  const sections = ['deen', 'character', 'family', 'finance', 'education', 'relationship', 'lifestyle'];
  const weights = { deen: 40, character: 20, family: 15, finance: 10, education: 5, relationship: 5, lifestyle: 5 };

  let totalScore = 0;
  let maxScore = 0;
  const sectionScores = {};

  sections.forEach(section => {
    const weight = weights[section];
    const questions = QS.filter(q => {
      if (q.s !== section) return false;
      if (q.g === 'both') return true;
      return answers1.gender === q.g || answers2.gender === q.g;
    });

    let sectionScore = 0;
    let sectionMax = 0;

    questions.forEach(q => {
      const ans1 = answers1[q.id];
      const ans2 = answers2[q.id];

      if (ans1 && ans2) {
        const score1 = q.opts.find(o => o.v === ans1)?.sc || 0;
        const score2 = q.opts.find(o => o.v === ans2)?.sc || 0;
        const diff = Math.abs(score1 - score2);
        const compatibilityScore = Math.max(0, 4 - diff); // 0-4 scale
        sectionScore += compatibilityScore;
        sectionMax += 4;
      }
    });

    const sectionPct = sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0;
    sectionScores[section] = Math.round(sectionPct);
    totalScore += (sectionPct / 100) * weight;
    maxScore += weight;
  });

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Generate insights
  const insights = generateInsights(sectionScores, overallScore);

  return {
    overallScore,
    sectionScores,
    insights,
    badge: getBadge(overallScore)
  };
}

// Generate insights based on scores
function generateInsights(sectionScores, overallScore) {
  const insights = [];

  if (sectionScores.deen < 70) {
    insights.push({ type: 'warning', text: 'Religious practice differences may need discussion and mutual growth.' });
  } else {
    insights.push({ type: 'positive', text: 'Strong alignment in Deen and religious values.' });
  }

  if (sectionScores.character < 70) {
    insights.push({ type: 'warning', text: 'Character and personality differences should be addressed early.' });
  } else {
    insights.push({ type: 'positive', text: 'Compatible character traits and decision-making styles.' });
  }

  if (sectionScores.family < 70) {
    insights.push({ type: 'neutral', text: 'Family values alignment needs open communication.' });
  }

  if (sectionScores.finance < 70) {
    insights.push({ type: 'warning', text: 'Financial expectations and stability should be discussed.' });
  }

  if (overallScore >= 80) {
    insights.push({ type: 'positive', text: 'Overall excellent compatibility! May Allah bless your union.' });
  } else if (overallScore >= 60) {
    insights.push({ type: 'neutral', text: 'Good foundation with some areas for improvement.' });
  } else {
    insights.push({ type: 'warning', text: 'Significant differences found. Consider counseling.' });
  }

  return insights;
}

// Get compatibility badge
function getBadge(score) {
  if (score >= 85) return { level: 'excellent', title: 'Excellent Match!', desc: 'MashaAllah! Strong compatibility across all areas.' };
  if (score >= 70) return { level: 'good', title: 'Good Match', desc: 'AlHamdulillah! Good alignment with minor differences.' };
  if (score >= 50) return { level: 'moderate', title: 'Moderate Match', desc: 'Some compatibility with areas needing work.' };
  return { level: 'poor', title: 'Low Compatibility', desc: 'Significant differences in key areas.' };
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`KufuMatch server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  });
});
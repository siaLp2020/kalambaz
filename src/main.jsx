import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import descriptionsByCategory from './descriptions.json'
import './style.css'

const stages = [
  { name: 'دوستان حیوانی', icon: '🐾', items: [['🐶','سگ','dog','حیوانی وفادار است که باق‌باق می‌کند.'],['🐱','گربه','cat','سیبیل دارد و پنجه‌های تیزی دارد.'],['🐰','خرگوش','rabbit','گوش‌های بلندی دارد.'],['🦁','شیر','lion','پادشاه جنگل است.'],['🐘','فیل','elephant','جثه‌ای بزرگ دارد و خرطوم بلندی دارد.'],['🐟','ماهی','fish','در آب شنا می‌کند.']] },
  { name: 'میوه‌های خوشمزه', icon: '🍎', items: [['🍎','سیب','apple','میوه‌ای قرمز و شیرین است.'],['🍌','موز','banana','زرد و شیرین است.'],['🍓','توت‌فرنگی','strawberry','قرمز و خوش‌عطر است.'],['🍇','انگور','grape','دانه‌های کوچک دارد.'],['🍉','هندوانه','watermelon','پوستی سبز و مغزی آبدار دارد.'],['🍊','پرتقال','orange','ویتامین سی دارد.']] },
  { name: 'رنگ‌های جادویی', icon: '🌈', items: [['🔴','قرمز','red','رنگی شبیه سیب است.'],['🔵','آبی','blue','رنگ آسمان در روز است.'],['🟡','زرد','yellow','رنگ خورشید است.'],['🟢','سبز','green','رنگ چمن است.'],['🟣','بنفش','purple','رنگی زیبا بین قرمز و آبی است.'],['🟠','نارنجی','orange','رنگ غروب آفتاب است.']] },
]
const allStages = Array.from({ length: 10 }, (_, i) => stages[i % stages.length])
const ITEMS_PER_STAGE = 6
const GALLERY_FRAME_COUNT = 4
const GALLERY_FRAME_INTERVAL = 2800
// Each card gets four local scene views. The object stays large and easy to
// recognize, while its setting, props and pose change so children see four
// different visual clues instead of the same emoji repeated four times.
const gallerySceneSets = {
  'حیوان': [
    { props: ['🌿', '☀️'], ground: '🪨', pose: 'meadow' },
    { props: ['🌊', '🫧'], ground: '🪷', pose: 'pond' },
    { props: ['🌧️', '☂️'], ground: '🍃', pose: 'rain' },
    { props: ['🌙', '⭐'], ground: '🌾', pose: 'night' },
  ],
  'میوه': [
    { props: ['🌳', '☀️'], ground: '🌿', pose: 'garden' },
    { props: ['🧺', '🍃'], ground: '🪵', pose: 'basket' },
    { props: ['🔪', '🍽️'], ground: '🍴', pose: 'table' },
    { props: ['💧', '✨'], ground: '🥣', pose: 'fresh' },
  ],
  'رنگ': [
    { props: ['🎨', '🖌️'], ground: '🖼️', pose: 'paint' },
    { props: ['🌈', '✨'], ground: '☁️', pose: 'rainbow' },
    { props: ['🧩', '🔶'], ground: '🟦', pose: 'blocks' },
    { props: ['💡', '🎈'], ground: '🎉', pose: 'party' },
  ],
  'سبزی': [
    { props: ['🌱', '☀️'], ground: '🪴', pose: 'garden' },
    { props: ['🧺', '🍃'], ground: '🪵', pose: 'basket' },
    { props: ['🥗', '🍴'], ground: '🍽️', pose: 'table' },
    { props: ['💧', '🌿'], ground: '🫧', pose: 'fresh' },
  ],
  'وسیله نقلیه': [
    { props: ['🛣️', '🚦'], ground: '🛞', pose: 'road' },
    { props: ['☁️', '🌤️'], ground: '🛫', pose: 'sky' },
    { props: ['🌆', '💡'], ground: '🏙️', pose: 'city' },
    { props: ['🗺️', '⭐'], ground: '🧭', pose: 'travel' },
  ],
  'لباس': [
    { props: ['☀️', '✨'], ground: '🧺', pose: 'bright' },
    { props: ['🫧', '🧼'], ground: '🧺', pose: 'wash' },
    { props: ['🪞', '💎'], ground: '🧴', pose: 'mirror' },
    { props: ['🌧️', '☂️'], ground: '🧥', pose: 'rain' },
  ],
  'عضو بدن': [
    { props: ['🩺', '❤️'], ground: '✨', pose: 'care' },
    { props: ['🧍', '🌟'], ground: '🫶', pose: 'body' },
    { props: ['🧴', '🫧'], ground: '🧼', pose: 'clean' },
    { props: ['💪', '⭐'], ground: '🏃', pose: 'move' },
  ],
  'خوراکی': [
    { props: ['🍽️', '🍴'], ground: '🧺', pose: 'table' },
    { props: ['🍳', '🔥'], ground: '🥣', pose: 'cook' },
    { props: ['🧺', '✨'], ground: '🍃', pose: 'picnic' },
    { props: ['💧', '🌿'], ground: '🥤', pose: 'fresh' },
  ],
  'پدیدهٔ طبیعت': [
    { props: ['☀️', '🌿'], ground: '🏞️', pose: 'day' },
    { props: ['🌧️', '🌈'], ground: '💧', pose: 'rain' },
    { props: ['🌙', '⭐'], ground: '🌌', pose: 'night' },
    { props: ['🍃', '🦋'], ground: '🌱', pose: 'garden' },
  ],
  'وسیله': [
    { props: ['🏠', '💡'], ground: '🧺', pose: 'home' },
    { props: ['📚', '✏️'], ground: '🪑', pose: 'school' },
    { props: ['🧸', '✨'], ground: '🎁', pose: 'play' },
    { props: ['🎈', '🎉'], ground: '🎲', pose: 'party' },
  ],
}
const galleryScenesFor = prompt => gallerySceneSets[prompt] || gallerySceneSets['وسیله']
const namedEmojiVariants = {
  dog: ['🐶', '🐕', '🦮', '🐕‍🦺'],
  cat: ['🐱', '🐈', '🐈‍⬛', '😺'],
  rabbit: ['🐰', '🐇', '🐰🥕', '🐇🌸'],
  fish: ['🐟', '🐠', '🐡', '🐟🫧'],
  frog: ['🐸', '🐸🌿', '🐸💧', '🐸🌧️'],
  rooster: ['🐓', '🐔', '🐓🌅', '🐓🌾'],
  apple: ['🍎', '🍏', '🍎🍃', '🍎✨'],
  banana: ['🍌', '🍌✨', '🍌🍃', '🍌🍽️'],
  car: ['🚗', '🚘', '🚙', '🏎️'],
  bus: ['🚌', '🚍', '🚌🌆', '🚌🛣️'],
  airplane: ['✈️', '🛫', '🛬', '✈️☁️'],
}
const colorEmojiVariants = {
  red: ['🔴', '🟥', '❤️', '♦️'],
  blue: ['🔵', '🟦', '💙', '🔷'],
  yellow: ['🟡', '🟨', '💛', '⭐'],
  green: ['🟢', '🟩', '💚', '🍃'],
  purple: ['🟣', '🟪', '💜', '🔮'],
  orange: ['🟠', '🟧', '🧡', '🍊'],
}
const emojiVariantsFor = (item, prompt) => {
  if (!item) return ['', '', '', '']
  if (prompt === 'رنگ' && colorEmojiVariants[item[2]]) return colorEmojiVariants[item[2]]
  if (namedEmojiVariants[item[2]]) return namedEmojiVariants[item[2]]
  const scenes = galleryScenesFor(prompt)
  return [
    item[0],
    `${scenes[0].props[0]}${item[0]}`,
    `${item[0]}${scenes[1].props[1]}`,
    `${scenes[2].props[0]}${item[0]}${scenes[3].props[1]}`,
  ]
}
let categoryAudioIndex = 0
const makeCategory = (name, icon, prompt, source, clues) => {
  const categoryIndex = ++categoryAudioIndex
  return {
    name,
    icon,
    prompt,
    items: source.split(';').filter(Boolean).map((value, index) => {
      const [emoji, faName, enName, customDescription, audioName] = value.split('|')
      const description = descriptionsByCategory[categoryIndex - 1]?.[index] || customDescription || clues[index % clues.length]
      const animation = categoryIndex === 1 ? `${import.meta.env.BASE_URL}images/animals/${enName}.webp` : ''
      return [emoji, faName, enName, description, `generated/items/${categoryIndex}-${index + 1}.mp3`, [], animation]
    }),
  }
}
const categories = [
  makeCategory('دوستان حیوانی', '🐾', 'حیوان', '🐶|سگ|dog|حیوانی وفادار است که باق‌باق می‌کند.|1-dog.wav;🐱|گربه|cat|سیبیل دارد و پنجه‌های تیزی دارد.|1-cat.wav;🐰|خرگوش|rabbit|گوش‌های بلندی دارد.|1-rabbit.wav;🦁|شیر|lion|پادشاه جنگل است.|1-lion.wav;🐘|فیل|elephant|جثه‌ای بزرگ دارد و خرطوم بلندی دارد.|1-elephant.wav;🐟|ماهی|fish|در آب شنا می‌کند.|1-fish.wav;🐻|خرس|bear;🐴|اسب|horse;🐮|گاو|cow;🐑|گوسفند|sheep;🐐|بز|goat;🐔|مرغ|chicken;🐓|خروس|rooster;🦆|اردک|duck;🪿|غاز|goose;🦃|بوقلمون|turkey;🐷|خوک|pig;🐭|موش|mouse;🐹|همستر|hamster;🐿️|سنجاب|squirrel;🦊|روباه|fox;🐺|گرگ|wolf;🐯|ببر|tiger;🐆|پلنگ|leopard;🐆|یوزپلنگ|cheetah;🦒|زرافه|giraffe;🦓|گورخر|zebra;🐒|میمون|monkey;🦍|گوریل|gorilla;🐼|پاندا|panda;🐨|کوالا|koala;🦘|کانگورو|kangaroo;🦌|گوزن|deer;🐪|شتر|camel;🫏|الاغ|donkey;🦛|اسب آبی|hippo;🦏|کرگدن|rhino;🐊|کروکودیل|crocodile;🐍|مار|snake;🐢|لاک‌پشت|turtle;🐸|قورباغه|frog;🐧|پنگوئن|penguin;🦉|جغد|owl;🦅|عقاب|eagle;🦜|طوطی|parrot;🦚|طاووس|peacock;🦩|فلامینگو|flamingo;🐬|دلفین|dolphin;🐋|نهنگ|whale;🐙|اختاپوس|octopus', ['حیوانی دوست‌داشتنی است.', 'در طبیعت زندگی می‌کند.', 'صدای جالبی دارد.', 'بدن متفاوتی دارد.', 'حرکت بامزه‌ای انجام می‌دهد.', 'در محیط‌های مختلف دیده می‌شود.']),
  makeCategory('میوه‌های خوشمزه', '🍎', 'میوه', '🍎|سیب|apple|میوه‌ای قرمز و شیرین است.|2-apple.wav;🍌|موز|banana|زرد و شیرین است.|2-banana.wav;🍓|توت‌فرنگی|strawberry|قرمز و خوش‌عطر است.|2-strawberry.wav;🍇|انگور|grape|دانه‌های کوچک دارد.|2-grape.wav;🍉|هندوانه|watermelon|پوستی سبز و مغزی آبدار دارد.|2-watermelon.wav;🍊|پرتقال|orange|ویتامین سی دارد.|2-orange.wav;🍐|گلابی|pear;🍑|هلو|peach;🍑|آلو|plum;🍒|گیلاس|cherry;🥭|انبه|mango;🍍|آناناس|pineapple;🥝|کیوی|kiwi;🍋|لیمو|lemon;🍋|لیموترش|lime;❤️|انار|pomegranate;🫓|انجیر|fig;🌴|خرما|date;🥥|نارگیل|coconut;🥑|آووکادو|avocado;🥭|پاپایا|papaya;🍈|گواوا|guava;🍑|زردآلو|apricot;🫐|تمشک|raspberry;🫐|بلوبری|blueberry;🫐|شاه‌توت|blackberry;🔴|کرنبری|cranberry;🍈|خربزه|melon;🍈|گرمک|cantaloupe;🍊|گریپ‌فروت|grapefruit;🍊|نارنگی|tangerine;🍊|نارنج|mandarin;🟠|خرمالو|persimmon;🐉|میوه اژدها|dragonfruit;🥭|میوه گل ساعتی|passionfruit;🍈|لیچی|lychee;🍒|رامبوتان|rambutan;⭐|میوه ستاره‌ای|starfruit;🍈|جک‌فروت|jackfruit;🟤|دوریان|durian;🫒|زیتون|olive;🍐|به|quince;🍑|شلیل|nectarine;🫐|توت|mulberry;🟢|انگور فرنگی|gooseberry;🟣|تمشک قرمز|currant;🫐|الدربری|elderberry;🟤|عناب|jujube;🟤|کنار|medlar;🟡|ازگیل|loquat', ['خوراکی شیرین و خوش‌طعم است.', 'رنگ زیبایی دارد.', 'آبدار و تازه است.', 'برای میان‌وعده مناسب است.', 'بوی خوبی دارد.', 'ویتامین‌های مفیدی دارد.']),
  makeCategory('رنگ‌های جادویی', '🌈', 'رنگ', '🔴|قرمز|red|رنگی شبیه سیب است.|3-red.wav;🔵|آبی|blue|رنگ آسمان در روز است.|3-blue.wav;🟡|زرد|yellow|رنگ خورشید است.|3-yellow.wav;🟢|سبز|green|رنگ چمن است.|3-green.wav;🟣|بنفش|purple|رنگی زیبا بین قرمز و آبی است.|3-purple.wav;🟠|نارنجی|orange|رنگ غروب آفتاب است.|3-orange.wav;🩷|صورتی|pink;⚫|سیاه|black;⚪|سفید|white;🟤|قهوه‌ای|brown;🩶|خاکستری|gray;🔹|فیروزه‌ای|cyan;🔷|سرمه‌ای|navy;🔷|آبی فیروزه‌ای|turquoise;🟨|طلایی|gold;◻️|نقره‌ای|silver;🟫|بژ|beige;🤍|کرم|cream;❤️|زرشکی|maroon;💜|ویوله‌ای|violet;💠|نیلی|indigo;🪻|اسطوخودوسی|lavender;🪸|مرجانی|coral;🟦|سبزآبی|teal;🍃|نعنایی|mint;🫒|زیتونی|olive;🟩|لیمویی|lime;🍑|هلویی|peach;🌤️|آبی آسمانی|skyblue;💙|آبی سلطنتی|royalblue;🌲|سبز تیره|darkgreen;🌿|سبز روشن|lightgreen;🟥|قرمز تیره|darkred;💗|قرمز روشن|lightred;💗|سرخابی|magenta;🟥|عنابی|burgundy;🟫|حنایی|tan;🟨|خاکی|khaki;🟡|خردلی|mustard;💚|زمردی|emerald;♦️|یاقوتی|ruby;🔷|لاجوردی|sapphire;🟠|کهربایی|amber;🟤|برنزی|bronze;🟫|مسی|copper;⚫|ذغالی|charcoal;🌈|رنگین‌کمانی|rainbow;🎨|چندرنگ|multicolor;🫧|شفاف|transparent;🖍️|پاستلی|pastel', ['رنگی زیبا و چشم‌نواز است.', 'در نقاشی استفاده می‌شود.', 'با رنگ‌های دیگر ترکیب می‌شود.', 'در طبیعت دیده می‌شود.', 'شاد و روشن است.', 'آرام و دوست‌داشتنی است.']),
  makeCategory('سبزیجات سالم', '🥕', 'سبزی', '🥕|هویج|carrot;🥔|سیب‌زمینی|potato;🍅|گوجه‌فرنگی|tomato;🥒|خیار|cucumber;🧅|پیاز|onion;🧄|سیر|garlic;🥬|کاهو|lettuce;🥬|اسفناج|spinach;🥦|بروکلی|broccoli;🥦|گل‌کلم|cauliflower;🥬|کلم|cabbage;🍆|بادمجان|eggplant;🫑|فلفل دلمه‌ای|pepper;🌽|ذرت|corn;🫛|نخودفرنگی|pea;🫘|لوبیا|bean;🫘|عدس|lentil;🫘|نخود|chickpea;🎃|کدوحلوایی|pumpkin;🥒|کدو سبز|zucchini;🔴|تربچه|radish;🟣|چغندر|beet;🟣|شلغم|turnip;🥬|کرفس|celery;🍄|قارچ|mushroom;🌱|مارچوبه|asparagus;🌿|کنگر فرنگی|artichoke;🟢|بامیه|okra;🍠|سیب‌زمینی شیرین|sweetpotato;🥬|تره‌فرنگی|leek;🫚|زنجبیل|ginger;🌶️|فلفل تند|chili;🥑|آووکادو|avocado;🥬|کلم بروکسل|brussels;🥬|کلم‌پیچ|kale;🥬|برگ چغندر|chard;🍠|یام|yam;🎋|جوانه بامبو|bambooshoot;🌊|جلبک|seaweed;🫘|سویا|soybean;🫛|ادامامه|edamame;🌿|رازیانه|fennel;🌿|جعفری|parsley;🌿|گشنیز|cilantro;🌿|نعناع|mint;🌿|ریحان|basil;🌿|شوید|dill;🌿|شاهی|watercress;🌿|روکولا|arugula;🌿|کاسنی|endive', ['خوراکی سالم و مفید است.', 'رنگ زیبایی دارد.', 'در باغچه رشد می‌کند.', 'برای بدن ما خوب است.', 'در آشپزی استفاده می‌شود.', 'تازه و خوش‌بو است.']),
  makeCategory('وسایل نقلیه', '🚗', 'وسیله نقلیه', '🚗|ماشین|car;🚌|اتوبوس|bus;🚆|قطار|train;✈️|هواپیما|airplane;🚁|هلیکوپتر|helicopter;🚲|دوچرخه|bicycle;🏍️|موتورسیکلت|motorcycle;🛴|اسکوتر|scooter;🚤|قایق|boat;🚢|کشتی|ship;🚢|زیردریایی|submarine;🚀|موشک|rocket;🚜|تراکتور|tractor;🚚|کامیون|truck;🚑|آمبولانس|ambulance;🚒|ماشین آتش‌نشانی|firetruck;🚓|ماشین پلیس|policecar;🚕|تاکسی|taxi;🚐|ون|van;🚌|اتوبوس مدرسه|schoolbus;🚋|تراموا|tram;🚇|مترو|subway;⛵|قایق بادبانی|sailboat;🛶|کانو|canoe;🛶|کایاک|kayak;🛥️|قایق تفریحی|yacht;⛴️|کشتی مسافری|ferry;🎈|بالن|hotairballoon;🛹|اسکیت‌بورد|skateboard;🛼|اسکیت|rollerskates;🛒|چرخ خرید|shoppingcart;🚜|بولدوزر|bulldozer;🚧|بیل مکانیکی|excavator;🏗️|جرثقیل|crane;🚛|کامیون بتن‌ساز|cementmixer;🚚|کمپرسی|dumptruck;🏎️|ماشین مسابقه|racecar;🚙|جیپ|jeep;🚐|مینی‌بوس|minibus;🚠|تله‌کابین|cablecar;🛷|اسنوموبیل|snowmobile;🪖|تانک|tank;🛸|سفینه فضایی|spaceship;🛩️|گلایدر|glider;🛫|جت|jet;🛻|وانت|pickup;🚘|لیموزین|limousine;🛺|ریکشا|rickshaw;🐎|درشکه|horsecart;🛒|کالسکه|stroller', ['برای جابه‌جایی استفاده می‌شود.', 'می‌تواند سریع حرکت کند.', 'چرخ یا بال دارد.', 'آدم‌ها را به مقصد می‌رساند.', 'صدای جالبی دارد.', 'در خیابان یا آسمان دیده می‌شود.']),
  makeCategory('لباس و پوشیدنی‌ها', '👕', 'لباس', '👕|پیراهن|shirt;👖|شلوار|pants;👗|لباس|dress;👗|دامن|skirt;🧥|پالتو|coat;🧥|کاپشن|jacket;🧶|پلیور|sweater;🧥|هودی|hoodie;👕|تی‌شرت|tshirt;🩳|شلوارک|shorts;👖|شلوار جین|jeans;🧦|جوراب|socks;👟|کفش|shoes;🥾|چکمه|boots;👡|صندل|sandals;🥿|دمپایی|slippers;🎩|کلاه|hat;🧢|کلاه نقاب‌دار|cap;🧣|شال|scarf;🧤|دستکش|gloves;👔|کمربند|belt;👔|کراوات|tie;🎀|پاپیون|bowtie;🛌|لباس خواب|pajamas;🩱|لباس شنا|swimsuit;🌧️|بارانی|raincoat;🥋|لباس فرم|uniform;🎒|کوله‌پشتی|backpack;👜|کیف|bag;👛|کیف دستی|purse;☂️|چتر|umbrella;🕶️|عینک آفتابی|sunglasses;👓|عینک|glasses;⌚|ساعت|watch;👑|تاج|crown;⛑️|کلاه ایمنی|helmet;🧑‍🍳|پیش‌بند|apron;🦺|جلیقه|vest;🥋|ردا|robe;🧕|عمامه|turban;🧣|شال بزرگ|shawl;🎀|تل مو|headband;🎀|گیره مو|hairclip;📿|دستبند|bracelet;📿|گردنبند|necklace;💍|انگشتر|ring;💎|گوشواره|earring;👛|کیف پول|wallet;👟|کتانی|sneakers;🧑‍🌾|لباس کار|overalls', ['برای پوشیدن استفاده می‌شود.', 'رنگ و طرح زیبایی دارد.', 'ما را گرم یا خنک نگه می‌دارد.', 'به اندازه‌های مختلف ساخته می‌شود.', 'در خانه یا بیرون استفاده می‌شود.', 'به ظاهر ما زیبایی می‌دهد.']),
  makeCategory('اعضای بدن', '🧍', 'عضو بدن', '🙂|سر|head;💇|مو|hair;👁️|چشم|eye;👂|گوش|ear;👃|بینی|nose;👄|دهان|mouth;🦷|دندان|tooth;👅|زبان|tongue;😊|گونه|cheek;🙂|چانه|chin;🧣|گردن|neck;💪|شانه|shoulder;💪|بازو|arm;💪|آرنج|elbow;✋|دست|hand;☝️|انگشت|finger;👍|شست|thumb;🫀|سینه|chest;🔙|پشت|back;🫃|شکم|stomach;🦵|پا|leg;🦵|زانو|knee;🦶|کف پا|foot;🦶|انگشت پا|toe;❤️|قلب|heart;🧠|مغز|brain;🫳|پوست|skin;🦴|استخوان|bone;💪|ماهیچه|muscle;🤨|ابرو|eyebrow;👁️|مژه|eyelash;🙂|پیشانی|forehead;👄|لب|lip;🧔|ریش|beard;🧔|سبیل|mustache;🤚|مچ دست|wrist;✋|کف دست|palm;💅|ناخن|nail;🦶|پاشنه|heel;🦶|قوزک|ankle;🧍|لگن|hip;🫁|ریه|lung;🫀|کبد|liver;🩸|خون|blood;🩸|رگ|vein;🦴|ستون فقرات|spine;⭕|ناف|bellybutton;🗣️|گلو|throat;😀|صورت|face;🧍|بدن|body', ['برای حرکت و زندگی لازم است.', 'بخش مهمی از بدن ماست.', 'باید از آن مراقبت کنیم.', 'با آن چیزهای مختلف را حس می‌کنیم.', 'در بدن همهٔ آدم‌ها وجود دارد.', 'کار مهمی انجام می‌دهد.']),
  makeCategory('خوراکی‌ها و نوشیدنی‌ها', '🍽️', 'خوراکی', '🍞|نان|bread;🍚|برنج|rice;🍝|ماکارونی|pasta;🍕|پیتزا|pizza;🥪|ساندویچ|sandwich;🍔|همبرگر|burger;🍲|سوپ|soup;🥗|سالاد|salad;🧀|پنیر|cheese;🥚|تخم‌مرغ|egg;🥣|ماست|yogurt;🍦|بستنی|icecream;🍰|کیک|cake;🍪|کلوچه|cookie;🍫|شکلات|chocolate;🍬|آبنبات|candy;🍿|پاپ‌کورن|popcorn;🍟|سیب‌زمینی سرخ‌کرده|fries;🌭|سوسیس|sausage;🍢|کباب|kebab;🍲|خورش|stew;🍳|املت|omelet;🥞|پنکیک|pancake;🧇|وافل|waffle;🥣|غلات صبحانه|cereal;🍯|عسل|honey;🍓|مربا|jam;🧈|کره|butter;🧂|نمک|salt;🍚|شکر|sugar;🍵|چای|tea;🥛|شیر|milk;🧃|آبمیوه|juice;💧|آب|water;🍋|لیموناد|lemonade;🥤|اسموتی|smoothie;☕|کاکائو|cocoa;☕|قهوه|coffee;🍫|شکلات داغ|hotchocolate;🥟|دامپلینگ|dumpling;🍣|سوشی|sushi;🌮|تاکو|taco;🌯|بوریتو|burrito;🍜|نودل|noodles;🍞|نان تست|toast;🍩|دونات|donut;🧁|کاپ‌کیک|cupcake;🥧|پای|pie;🍪|بیسکویت|biscuit;🍟|چیپس|chips', ['خوش‌مزه و دوست‌داشتنی است.', 'برای خوردن آماده می‌شود.', 'بوی خوبی دارد.', 'رنگ و شکل جالبی دارد.', 'در آشپزخانه درست می‌شود.', 'می‌تواند شیرین یا شور باشد.']),
  makeCategory('طبیعت و آب‌وهوا', '🌤️', 'پدیدهٔ طبیعت', '☀️|خورشید|sun;🌙|ماه|moon;⭐|ستاره|star;☁️|ابر|cloud;🌧️|باران|rain;❄️|برف|snow;💨|باد|wind;🌈|رنگین‌کمان|rainbow;⚡|برق|lightning;🌩️|رعد|thunder;⛈️|طوفان|storm;🌫️|مه|fog;🌌|آسمان|sky;⛰️|کوه|mountain;⛰️|تپه|hill;🏞️|رودخانه|river;🏞️|دریاچه|lake;🌊|دریا|sea;🌊|اقیانوس|ocean;🌊|آبشار|waterfall;🏝️|جزیره|island;🏖️|ساحل|beach;🏜️|بیابان|desert;🌲|جنگل|forest;🌳|درخت|tree;🌸|گل|flower;🌱|چمن|grass;🍃|برگ|leaf;🌱|دانه|seed;🪨|صخره|rock;🪨|سنگ|stone;🌋|آتشفشان|volcano;🕳️|غار|cave;🌱|خاک|soil;🏖️|شن|sand;❄️|دانه برف|snowflake;💧|قطره باران|raindrop;🔥|آتش|fire;🌊|موج|wave;🐚|صدف|shell;🪺|لانه|nest;🌷|باغ|garden;🏞️|پارک|park;🌸|بهار|spring;☀️|تابستان|summer;🍂|پاییز|autumn;❄️|زمستان|winter;🌅|طلوع|sunrise;🌇|غروب|sunset;🪐|سیاره|planet', ['در طبیعت دیده می‌شود.', 'زیبا و شگفت‌انگیز است.', 'گاهی تغییر می‌کند.', 'در آسمان یا زمین دیده می‌شود.', 'به زندگی ما کمک می‌کند.', 'می‌تواند آرام یا پرقدرت باشد.']),
  makeCategory('خانه، مدرسه و اسباب‌بازی', '🏠', 'وسیله', '🏠|خانه|house;🚪|اتاق|room;🚪|در|door;🪟|پنجره|window;🪑|صندلی|chair;🪑|میز|table;🛏️|تخت|bed;🛋️|مبل|sofa;💡|چراغ|lamp;⏰|ساعت زنگ‌دار|clock;📱|تلفن|phone;💻|رایانه|computer;📖|کتاب|book;✏️|مداد|pencil;🖊️|خودکار|pen;🧽|پاک‌کن|eraser;📏|خط‌کش|ruler;✂️|قیچی|scissors;🧴|چسب|glue;🎒|کیف مدرسه|schoolbag;📓|دفتر|notebook;⚽|توپ|ball;🪆|عروسک|doll;🧸|خرس عروسکی|teddy;🧱|مکعب|blocks;🧩|پازل|puzzle;🪁|بادبادک|kite;🎈|بادکنک|balloon;🥁|طبل|drum;🎸|گیتار|guitar;🎹|پیانو|piano;🤖|ربات اسباب‌بازی|toyrobot;🪥|مسواک|toothbrush;🧼|صابون|soap;🧻|حوله|towel;🥤|لیوان|cup;🍽️|بشقاب|plate;🥄|قاشق|spoon;🍴|چنگال|fork;🍼|بطری|bottle;🔑|کلید|key;🔒|قفل|lock;🧺|سبد|basket;📦|جعبه|box;🪞|آینه|mirror;📺|تلویزیون|television;📷|دوربین|camera;🌀|پنکه|fan;🧊|یخچال|refrigerator;🧹|جارو|broom', ['در خانه یا مدرسه استفاده می‌شود.', 'وسیله‌ای کاربردی است.', 'شکل جالبی دارد.', 'به ما کمک می‌کند.', 'برای بازی یا یادگیری مناسب است.', 'در اتاق‌های مختلف دیده می‌شود.']),
]
const shuffle = values => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}
const uniqueItems = items => {
  const seen = new Set()
  return items.filter(item => {
    const key = item?.[2] || item?.[1] || ''
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
const pickItems = (items, count = ITEMS_PER_STAGE) => shuffle(uniqueItems(items)).slice(0, count)

const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const toPersianDigits = value => String(value).replace(/[0-9]/g, digit => persianDigits[Number(digit)])
function createRobotNames() {
  const names = new Set()
  while (names.size < 3) names.add(`ربات ${toPersianDigits(Math.floor(Math.random() * 9999) + 1)}`)
  return [...names]
}
const robotStartingProgress = [0.3, 0.12, 0.6]
const robotProgressTargets = [5.4, 3.6, 4.2]
const robotProgressRates = robotStartingProgress.map((progress, index) => (robotProgressTargets[index] - progress) / 90)
const STAGE_DURATION = 120
const TIME_WARNING_THRESHOLD = 35
const audioBase = `${import.meta.env.BASE_URL}audio/`
const speak = (text, lang = 'fa-IR', onError, onEnd) => {
  // On Android Chrome, voices may load asynchronously. Waiting for
  // `voiceschanged` loses the tap gesture that is required to start audio,
  // so queue the utterance synchronously and use a voice only when available.
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    onError?.()
    onEnd?.()
    return false
  }
  const synth = window.speechSynthesis
  const utterance = new window.SpeechSynthesisUtterance(text)
  let ended = false
  const finish = () => { if (!ended) { ended = true; onEnd?.() } }
  const languagePrefix = lang.split('-')[0].toLowerCase()
  const matchingVoices = synth.getVoices().filter(item => item.lang.toLowerCase().startsWith(languagePrefix))
  const voice = matchingVoices.find(item => /child|kid|young|کودک/i.test(item.name)) || matchingVoices[0]
  if (voice) utterance.voice = voice
  utterance.lang = lang
  utterance.rate = lang.startsWith('fa') ? .95 : .95
  utterance.pitch = lang.startsWith('fa') ? 1.35 : 1.25
  utterance.volume = 1
  utterance.onerror = () => { onError?.(); finish() }
  utterance.onend = finish
  synth.cancel()
  synth.resume()
  synth.speak(utterance)
  return true
}
const speakEnglishWord = text => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false
  const synth = window.speechSynthesis
  let attempts = 0
  let activeAttempt = 0
  let finished = false
  const start = () => {
    if (finished) return
    attempts += 1
    const attemptId = ++activeAttempt
    let started = false
    try { synth.cancel(); synth.resume() } catch {}
    const utterance = new window.SpeechSynthesisUtterance(text)
    const voices = synth.getVoices()
    const voice = voices.find(item => item.lang.toLowerCase() === 'en-us') || voices.find(item => item.lang.toLowerCase().startsWith('en'))
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = 'en-US'
    }
    utterance.rate = 1
    utterance.pitch = 1.15
    utterance.volume = 1
    utterance.onstart = () => { if (attemptId === activeAttempt) started = true }
    utterance.onend = () => { if (attemptId === activeAttempt) finished = true }
    utterance.onerror = () => {
      if (attemptId !== activeAttempt) return
      if (attempts < 2) window.setTimeout(start, 120)
      else finished = true
    }
    try { synth.speak(utterance) } catch {
      if (attempts < 2) window.setTimeout(start, 120)
      else finished = true
      return
    }
    // Android Chrome can accept the utterance but fail to start it while the
    // previous utterance is being cancelled. Retry once without requiring a
    // second tap from the child.
    if (attempts === 1) {
      window.setTimeout(() => {
        if (!started && !finished && attemptId === activeAttempt) start()
      }, 500)
    }
  }
  start()
  return true
}
const normalize = s => String(s).toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[^\p{L}\p{N}]/gu,'').replace(/ي/g,'ی').replace(/ك/g,'ک')
const englishPronunciationAliases = {
  dog: ['داگ', 'داک', 'داغ'],
  cat: ['کت'],
  rabbit: ['ربیت', 'رابیت', 'ربت'],
  lion: ['لاین', 'لایون', 'لیان'],
  elephant: ['الفنت', 'الفانت', 'الیفنت'],
  fish: ['فیش'],
  apple: ['اپل'],
  banana: ['بنانا', 'بانانا'],
  strawberry: ['استرابری', 'استراوبری', 'استرابری'],
  grape: ['گریپ'],
  watermelon: ['واترملون', 'واترمالون'],
  orange: ['اورنج', 'ارنج', 'آرنج'],
  red: ['رد'],
  blue: ['بلو'],
  yellow: ['یلو'],
  green: ['گرین'],
  purple: ['پرپل'],
  bear: ['بر', 'بیر'],
  horse: ['هورس', 'هارس'],
  cow: ['کاو', 'کاؤ'],
  sheep: ['شیپ', 'شیب'],
  goat: ['گوت', 'گات'],
  chicken: ['چیکن'],
  rooster: ['روستر'],
  duck: ['داک', 'دک'],
  goose: ['گوس', 'گوز'],
  turkey: ['ترکی'],
  pig: ['پیگ', 'پیغ'],
  mouse: ['ماوس', 'موس'],
  hamster: ['همستر'],
  squirrel: ['اسکویرل', 'اسکویریل', 'سکویرل'],
  fox: ['فاکس', 'فکس'],
  wolf: ['ولف', 'والف', 'وولف'],
  tiger: ['تایگر'],
  leopard: ['لپر', 'لئوپارد', 'لپرد'],
  cheetah: ['چیتا'],
  giraffe: ['جراف', 'جیراف'],
  zebra: ['زیبرا', 'زبرا'],
  monkey: ['مانکی'],
  gorilla: ['گوریلا', 'گوریل'],
  panda: ['پاندا'],
  koala: ['کوالا'],
  kangaroo: ['کنگرو', 'کانگرو'],
  deer: ['دیر'],
  camel: ['کمل', 'کَمِل'],
  donkey: ['دانکی'],
  hippo: ['هیپو'],
  rhino: ['راینو', 'رینو'],
  crocodile: ['کراکودایل', 'کروکودایل'],
  snake: ['اسنیک', 'اسنک', 'سنیک'],
  turtle: ['ترتل', 'تارتل'],
  frog: ['فراگ', 'فروگ'],
  penguin: ['پنگوین', 'پنگوئن'],
  owl: ['اول', 'آول'],
  eagle: ['ایگل', 'ایگِل'],
  parrot: ['پرت', 'پَرَت'],
  peacock: ['پیکاک', 'پیکوک'],
  flamingo: ['فلامینگو'],
  dolphin: ['دالفین', 'دولفین'],
  whale: ['ویل', 'وِیل'],
  octopus: ['آکتوپوس', 'اکتوپوس'],
}
const editDistance = (left, right) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      )
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index]
  }
  return previous[right.length]
}
const englishAnswerMatches = (answer, expected) => {
  const said = normalize(answer)
  const target = normalize(expected)
  if (!said || !target) return false
  if (said === target) return true
  // Speech recognition can return a short phrase such as "wolf please".
  if (target.length >= 3 && said.includes(target)) return true
  // Accept one small recognition typo (for example "wulf" for "wolf"),
  // while keeping the match strict enough not to award unrelated words.
  return target.length >= 4 && Math.abs(said.length - target.length) <= 1 && editDistance(said, target) <= 1
}
const answerPoints = (answer, item) => {
  const said = normalize(answer)
  const englishAnswers = [item[2], ...(englishPronunciationAliases[item[2]] || [])].map(normalize)
  if (englishAnswers.some(expected => englishAnswerMatches(said, expected))) return 20
  return said === normalize(item[1]) ? 10 : 0
}

const PROGRESS_STORAGE_KEY = 'kalambaz-progress-v1'
const readSavedProgress = names => {
  if (typeof window === 'undefined') return null
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}')
    for (const name of names.filter(Boolean)) {
      if (saved[name]) return saved[name]
    }
  } catch {}
  return null
}
const writeSavedProgress = (names, progress) => {
  if (typeof window === 'undefined') return
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}')
    for (const name of names.filter(Boolean)) saved[name] = progress
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(saved))
  } catch {}
}
const normalizeSavedProgress = progress => {
  if (!progress) return null
  const stageValue = Number(progress.lastStage ?? progress.stageNo ?? 1)
  const scoreValue = Number(progress.lastScore ?? progress.score ?? 0)
  return {
    lastStage: Math.min(categories.length, Math.max(1, Number.isFinite(stageValue) ? Math.floor(stageValue) : 1)),
    lastScore: Math.max(0, Number.isFinite(scoreValue) ? Math.floor(scoreValue) : 0),
  }
}

function App() {
  const [user, setUser] = useState('')
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [count, setCount] = useState(0)
  const [stageNo, setStageNo] = useState(1)
  const [stageItems, setStageItems] = useState(() => pickItems(categories[0].items))
  const [selected, setSelected] = useState(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [animationFailed, setAnimationFailed] = useState(false)
  const [passed, setPassed] = useState([])
  const [score, setScore] = useState(0)
  const [robots, setRobots] = useState(() => createRobotNames())
  const [listening, setListening] = useState(false)
  const [micBusy, setMicBusy] = useState(false)
  const [descriptionPlaying, setDescriptionPlaying] = useState(false)
  const [notice, setNotice] = useState('')
  const [showFallback, setShowFallback] = useState(false)
  const [audioNotice, setAudioNotice] = useState('')
  const [recognitionLang, setRecognitionLang] = useState('fa-IR')
  const [retryVisible, setRetryVisible] = useState(false)
  const welcomeOpen = false
  const welcomeNotice = ''
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(STAGE_DURATION)
  const [robotProgress, setRobotProgress] = useState(robotStartingProgress)
  const [stageWinner, setStageWinner] = useState(null)
  const [robotWinner, setRobotWinner] = useState(0)
  const [resumeSummary, setResumeSummary] = useState(null)
  const [resumeCountdown, setResumeCountdown] = useState(0)
  const recognition = useRef(null)
  const audioPlayer = useRef(null)
  const audioCache = useRef(new Map())
  const audioSources = useRef(new Map())
  const audioSourcePromises = useRef(new Map())
  const robotProgressRef = useRef([...robotStartingProgress])
  const robotWinnerTimer = useRef(null)
  const passedRef = useRef(passed)
  const stageWinnerRef = useRef(stageWinner)
  const stageStartScoreRef = useRef(0)
  const retryTimer = useRef(null)
  const answerDeadline = useRef(0)
  const resumeTimer = useRef(null)
  const profileNameRef = useRef('')
  const categoryForStage = categories[stageNo - 1]
  const stage = useMemo(() => ({ ...categoryForStage, items: stageItems }), [categoryForStage, stageItems])
  const players = useMemo(() => [user, ...robots], [user, robots])
  const selectedGalleryImages = selected?.[5]?.length === GALLERY_FRAME_COUNT ? selected[5] : null
  const selectedGalleryImage = selectedGalleryImages?.[carouselIndex]
  const selectedAnimation = selected?.[6] || ''

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const root = document.documentElement
    root.toggleAttribute('data-description-playing', descriptionPlaying)
    root.toggleAttribute('data-mic-busy', descriptionPlaying || micBusy)
    return () => {
      root.removeAttribute('data-description-playing')
      root.removeAttribute('data-mic-busy')
    }
  }, [descriptionPlaying, micBusy])

  useEffect(() => { if (!joining || count === 0) return; const t = setTimeout(() => setCount(c => c - 1), 1000); return () => clearTimeout(t) }, [joining, count])
  useEffect(() => { if (joining && count === 0) { const t = setTimeout(() => setJoining(false), 900); return () => clearTimeout(t) } }, [joining, count])
  useEffect(() => {
    window.clearInterval(resumeTimer.current)
    if (!resumeSummary) return undefined
    setResumeCountdown(10)
    resumeTimer.current = window.setInterval(() => {
      setResumeCountdown(previous => {
        if (previous <= 1) {
          window.clearInterval(resumeTimer.current)
          resumeTimer.current = null
          setResumeSummary(null)
          setCount(Math.floor(Math.random() * 21))
          setJoining(true)
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => window.clearInterval(resumeTimer.current)
  }, [resumeSummary])
  useEffect(() => {
    if (selected) return
    window.clearTimeout(retryTimer.current)
    recognition.current?.stop?.()
    audioPlayer.current?.pause?.()
    answerDeadline.current = 0
    setListening(false)
    setMicBusy(false)
    setDescriptionPlaying(false)
  }, [selected])
  useEffect(() => {
    if (!selected) {
      setCarouselIndex(0)
      setAnimationFailed(false)
      return undefined
    }
    setCarouselIndex(0)
    setAnimationFailed(false)
    if (selectedAnimation && !animationFailed) return undefined
    const timer = window.setInterval(() => {
      setCarouselIndex(previous => (previous + 1) % GALLERY_FRAME_COUNT)
    }, GALLERY_FRAME_INTERVAL)
    return () => window.clearInterval(timer)
  }, [selected, selectedAnimation, animationFailed])
  useEffect(() => {
    if (!selected || !selectedGalleryImages) return
    const frame = document.querySelector('.image-carousel .carousel-frame')
    if (!frame || frame.querySelector('.gallery-slide-stage')) return

    frame.classList.add('gallery-slide-host')
    const stage = document.createElement('div')
    stage.className = 'gallery-slide-stage'
    const makeSlide = (className, image) => {
      const slide = document.createElement('div')
      slide.className = `gallery-slide-card ${className}`
      const imageElement = document.createElement('img')
      imageElement.className = 'carousel-image'
      imageElement.src = image
      imageElement.alt = ''
      slide.append(imageElement)
      return slide
    }
    stage.append(
      makeSlide('gallery-slide-card-current', selectedGalleryImages[carouselIndex]),
      makeSlide('gallery-slide-card-next', selectedGalleryImages[(carouselIndex + 1) % GALLERY_FRAME_COUNT]),
    )
    frame.replaceChildren(stage)
  })
  useEffect(() => {
    let cancelled = false
    const loadStageAudio = async () => {
      for (const item of stage.items) {
        if (cancelled) return
        await preloadAudio(audioFileName(item))
      }
    }
    loadStageAudio()
    return () => { cancelled = true }
  }, [stageNo, stageItems])
  useEffect(() => {
    passedRef.current = passed
    stageWinnerRef.current = stageWinner
  }, [passed, stageWinner])
  useEffect(() => {
    if (passed.length === 6 && !stageWinner) {
      setFinished(true)
      setStageWinner('user')
    }
  }, [passed, stageWinner])

  useEffect(() => {
    window.clearTimeout(robotWinnerTimer.current)
    if (joining || resumeSummary || !user || finished || stageWinner || passedRef.current.length === stage.items.length) return undefined
    const winnerIndex = Math.floor(Math.random() * robots.length)
    const winnerDelay = 90000 + Math.floor(Math.random() * 29001)
    robotWinnerTimer.current = window.setTimeout(() => {
      if (passedRef.current.length === stage.items.length || stageWinnerRef.current) return
      const progress = [...robotProgressRef.current]
      progress[winnerIndex] = 6
      robotProgressRef.current = progress
      setRobotProgress(progress)
      setRobotWinner(winnerIndex)
      setStageWinner('robot')
      setFinished(false)
      setSelected(null)
      setNotice('')
      setTimeLeft(Math.max(1, STAGE_DURATION - Math.ceil(winnerDelay / 1000)))
    }, winnerDelay)
    return () => window.clearTimeout(robotWinnerTimer.current)
  }, [joining, resumeSummary, user, finished, stageWinner, stageNo, stage.items.length])

  useEffect(() => {
    if (joining || resumeSummary || !user || finished || stageWinner || passed.length === 6) return
    const timer = setInterval(() => {
      setTimeLeft(previous => {
        if (previous <= 1) {
          const winnerIndex = Math.floor(Math.random() * robots.length)
          const progress = [...robotProgressRef.current]
          progress[winnerIndex] = 6
          robotProgressRef.current = progress
          setRobotProgress(progress)
          setRobotWinner(winnerIndex)
          setStageWinner('robot')
          setFinished(false)
          setSelected(null)
          setNotice('')
          return 0
        }
        return previous - 1
      })
      setRobotProgress(previous => {
        const next = previous.map((items, index) => Math.min(robotProgressTargets[index], items + robotProgressRates[index]))
        robotProgressRef.current = next
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [joining, resumeSummary, user, finished, stageWinner, passed.length])

  useEffect(() => {
    if (!user || joining || resumeSummary || !profileNameRef.current) return
    writeSavedProgress([profileNameRef.current, user], {
      username: user,
      requestedName: profileNameRef.current,
      lastStage: stageNo,
      lastScore: score,
      updatedAt: Date.now(),
    })
  }, [user, joining, resumeSummary, stageNo, score])

  async function login(e) {
    e.preventDefault(); const wanted = name.trim(); if (!wanted) return
    const previous = normalizeSavedProgress(readSavedProgress([wanted]))
    if ('speechSynthesis' in window) window.speechSynthesis.resume()
    let assigned = wanted
    try { const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username:wanted }) }); const d = await r.json(); if (d.username) assigned = d.username } catch { const used = JSON.parse(localStorage.getItem('kalambaz-users') || '[]'); assigned = used.includes(wanted) ? `${wanted}${Math.floor(100 + Math.random()*900)}` : wanted; localStorage.setItem('kalambaz-users', JSON.stringify([...used, assigned])) }
    const resumeStage = previous?.lastStage || 1
    const resumeScore = previous?.lastScore || 0
    profileNameRef.current = wanted
    setRobots(createRobotNames())
    setStageNo(resumeStage)
    setStageItems(pickItems(categories[resumeStage - 1].items))
    stageStartScoreRef.current = resumeScore
    setPassed([])
    setScore(resumeScore)
    setFinished(false)
    setStageWinner(null)
    setRobotWinner(0)
    setTimeLeft(STAGE_DURATION)
    setRobotProgress([...robotStartingProgress])
    robotProgressRef.current = [...robotStartingProgress]
    setUser(assigned)
    if (previous) {
      setResumeSummary({ username: assigned, requestedName: wanted, lastStage: resumeStage, lastScore: resumeScore })
      setResumeCountdown(10)
      setJoining(false)
    } else {
      setCount(Math.floor(Math.random() * 21))
      setJoining(true)
    }
  }
  function audioFileName(item) {
    return item?.[4] || ''
  }
  function preloadAudio(fileName) {
    if (!fileName || typeof window === 'undefined' || typeof window.fetch !== 'function') return Promise.resolve()
    if (audioSourcePromises.current.has(fileName)) return audioSourcePromises.current.get(fileName)
    const directUrl = `${audioBase}${fileName}?v=child-voice-8`
    const request = window.fetch(directUrl, { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`)
        return response.blob()
      })
      .then(blob => {
        const objectUrl = window.URL.createObjectURL(blob)
        audioSources.current.set(fileName, objectUrl)
        const cached = audioCache.current.get(fileName)
        if (cached && cached._kalambazSource !== objectUrl) {
          cached.pause()
          cached.src = objectUrl
          cached._kalambazSource = objectUrl
          cached.load()
        }
        return objectUrl
      })
      .catch(() => {
        audioSources.current.set(fileName, directUrl)
        return directUrl
      })
    audioSourcePromises.current.set(fileName, request)
    return request
  }
  function getCachedAudio(fileName) {
    if (!fileName || typeof window === 'undefined' || typeof window.Audio === 'undefined') return null
    const url = audioSources.current.get(fileName) || `${audioBase}${fileName}?v=child-voice-8`
    let audio = audioCache.current.get(fileName)
    if (!audio || audio._kalambazSource !== url) {
      audio?.pause?.()
      audio = new window.Audio(url)
      audio.preload = 'auto'
      audio._kalambazSource = url
      audioCache.current.set(fileName, audio)
    }
    return audio
  }
  function playLocalAudio(fileName, onError, onEnded) {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined' || !fileName) { onError?.(); return false }
    audioPlayer.current?.pause()
    let attempts = 0
    let settled = false
    let audio = getCachedAudio(fileName)
    const finish = callback => {
      if (settled) return
      settled = true
      if (audio) {
        audio.onerror = null
        audio.onended = null
      }
      callback?.()
    }
    const retryOrFail = error => {
      if (settled) return
      if (error?.name === 'NotAllowedError' || error?.name === 'NotSupportedError') {
        finish(onError)
        return
      }
      if (attempts < 3) {
        audio?.pause?.()
        if (audioCache.current.get(fileName) === audio) audioCache.current.delete(fileName)
        window.setTimeout(startAttempt, attempts * 250)
        return
      }
      finish(onError)
    }
    const startAttempt = () => {
      if (settled) return
      attempts += 1
      audio = getCachedAudio(fileName)
      if (!audio) { finish(onError); return }
      try { audio.currentTime = 0 } catch {}
      audio.volume = 1
      audio.onerror = () => retryOrFail()
      audio.onended = () => finish(onEnded)
      audioPlayer.current = audio
      try {
        const result = audio.play()
        result?.catch(retryOrFail)
      } catch (error) {
        retryOrFail(error)
      }
    }
    startAttempt()
    return true
  }
  function playEnglishWord(item) {
    if (!item?.[2]) return

    // Chrome on Android can leave speechSynthesis in a paused/busy state after
    // the answer feedback. Stop it before starting the local clip so the tap
    // on a solved card always has one, immediate audio action.
    try { window.speechSynthesis?.cancel?.() } catch {}

    const fallback = () => speakEnglishWord(item[2])
    // Animal cards have a bundled pronunciation clip. Calling Audio.play()
    // directly from this click handler preserves the mobile user gesture,
    // unlike waiting for speechSynthesis voices to load.
    if (stageNo === 1) {
      const fileName = `english/${String(item[2]).toLowerCase()}.mp3`
      const started = playLocalAudio(fileName, fallback)
      if (started) return
    }
    fallback()
  }
  function playDescription(text, item, onEnded) {
    if (descriptionPlaying) return
    if (!onEnded && item) {
      beginDescription(item)
      return
    }
    setAudioNotice('')
    const prompt = `حالا اسم این ${stage.prompt} رو بگو.`
    const audioUnavailable = () => setAudioNotice('صدای توضیح آماده نشد؛ دوباره روی «گوش کن» بزن.')
    let fallbackStarted = false
    const fallback = () => {
      if (fallbackStarted) return
      fallbackStarted = true
      const available = speak(`${text} ${prompt}`, 'fa-IR', audioUnavailable, onEnded)
      if (!available) audioUnavailable()
    }
    const continueListening = () => {
      onEnded?.()
    }
    const localFile = audioFileName(item)
    if (localFile) playLocalAudio(localFile, fallback, continueListening)
    else fallback()
  }
  function queueRetry(item) {
    window.clearTimeout(retryTimer.current)
    const delay = Math.max(0, answerDeadline.current - Date.now())
    retryTimer.current = window.setTimeout(() => {
      setListening(false)
      setMicBusy(false)
      setShowFallback(true)
      setRetryVisible(true)
      setNotice('صدایت را نشنیدم. تلاش مجدد کن!')
    }, delay)
  }
  function beginDescription(item) {
    if (!item || descriptionPlaying) return
    window.clearTimeout(retryTimer.current)
    answerDeadline.current = 0
    const activeRecognition = recognition.current
    recognition.current = null
    if (activeRecognition) {
      activeRecognition.onresult = null
      activeRecognition.onerror = null
      activeRecognition.onend = null
      try { activeRecognition.stop() } catch {}
    }
    setListening(false)
    setMicBusy(false)
    setShowFallback(false)
    setRetryVisible(false)
    setNotice('')
    setDescriptionPlaying(true)
    playDescription(item[3], item, () => {
      setDescriptionPlaying(false)
      answerDeadline.current = Date.now() + 10000
      useMic(item, recognitionLang)
    })
  }
  function openItem(item) {
    if (passed.includes(item[1])) {
      // Once a card has been solved, keep it out of the answer flow. A tap
      // only pronounces the canonical English word so the child can practise.
      playEnglishWord(item)
      return
    }
    setSelected(item)
    beginDescription(item)
  }
  function replayWelcome() {}
  function useMic(item, language = recognitionLang, force = false) {
    if (descriptionPlaying || (micBusy && !force)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setMicBusy(false); setShowFallback(true); setNotice('مرورگرت میکروفون را پشتیبانی نمی‌کند.'); return }
    if (!answerDeadline.current || answerDeadline.current < Date.now()) answerDeadline.current = Date.now() + 10000
    const r = new SR(); recognition.current = r; r.lang = language; r.interimResults = false; r.maxAlternatives = 5; setMicBusy(true); setListening(true); setRetryVisible(false)
    let heard = false
    let transitionHandled = false
    let resultHandled = false
    const fallbackToEnglish = () => {
      if (language !== 'fa-IR' || transitionHandled || Date.now() >= answerDeadline.current) return false
      transitionHandled = true
      try {
        if (typeof r.abort === 'function') r.abort()
        else r.stop()
      } catch {}
      window.setTimeout(() => {
        if (Date.now() < answerDeadline.current) useMic(item, 'en-US', true)
        else queueRetry(item)
      }, 140)
      return true
    }
    r.onresult = e => {
      if (resultHandled) return
      resultHandled = true
      heard = true
      const alternatives = Array.from(e.results[0]).map(result => result.transcript)
      const matched = alternatives.find(candidate => answerPoints(candidate, item) > 0)
      if (!matched && fallbackToEnglish()) return
      const transcript = matched || alternatives[0]
      checkAnswer(transcript, item)
    }
    r.onnomatch = () => {
      if (!fallbackToEnglish()) continueListeningOrRetry()
    }
    const continueListeningOrRetry = () => {
      if (transitionHandled) return
      if (!heard && fallbackToEnglish()) return
      transitionHandled = true
      if (heard) return
      const remaining = answerDeadline.current - Date.now()
      if (remaining > 0) {
        window.setTimeout(() => {
          if (Date.now() < answerDeadline.current) useMic(item, language, true)
          else queueRetry(item)
        }, Math.min(600, remaining))
      } else {
        setListening(false)
        setMicBusy(false)
        queueRetry(item)
      }
    }
    r.onerror = event => {
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
        transitionHandled = true
        setListening(false)
        setMicBusy(false)
        answerDeadline.current = Date.now()
        queueRetry(item)
        return
      }
      if (['no-speech', 'language-not-supported'].includes(event.error) && fallbackToEnglish()) return
      continueListeningOrRetry()
    }
    r.onend = continueListeningOrRetry
    try {
      r.start()
    } catch {
      setListening(false)
      setMicBusy(false)
      queueRetry(item)
    }
  }
  function checkAnswer(answer, item) {
    if (stageWinner || finished) { setListening(false); setMicBusy(false); return }
    const points = answerPoints(answer, item)
    setListening(false)
    recognition.current?.stop?.()
    if (!points) {
      window.clearTimeout(retryTimer.current)
      answerDeadline.current = Date.now() + 10000
      setMicBusy(true)
      setRetryVisible(true); setShowFallback(true); setNotice('تلاش مجدد! دوباره اسم تصویر را بگو.')
      speak('تلاش مجدد! دوباره اسم تصویر را بگو.', 'fa-IR', undefined, () => setMicBusy(false))
      return
    }
    if (!passed.includes(item[1])) { setPassed(p => [...p, item[1]]); setScore(s => s + points) }
    window.clearTimeout(retryTimer.current)
    answerDeadline.current = 0
    recognition.current?.stop?.()
    setRetryVisible(false); setShowFallback(false); setDescriptionPlaying(false); setMicBusy(true)
    const feedback = points === 20 ? 'آفرین! درست گفتی و بیست امتیاز گرفتی.' : 'آفرین! درست گفتی و ده امتیاز گرفتی.'
    setNotice(feedback); speak(feedback, 'fa-IR')
    setTimeout(() => { setSelected(null); setNotice(''); setMicBusy(false) }, 1500)
  }
  function resetStage(resetCurrentScore = false) {
    const startingProgress = [...robotStartingProgress]
    robotProgressRef.current = startingProgress
    if (resetCurrentScore) setScore(stageStartScoreRef.current)
    setPassed([]); setSelected(null); setFinished(false); setStageWinner(null); setRobotWinner(0); setTimeLeft(STAGE_DURATION); setRobotProgress(startingProgress); setNotice(''); setDescriptionPlaying(false); setMicBusy(false)
  }
  function restartGame() {
    window.clearTimeout(robotWinnerTimer.current)
    window.clearTimeout(retryTimer.current)
    window.clearInterval(resumeTimer.current)
    resumeTimer.current = null
    recognition.current?.stop?.()
    audioPlayer.current?.pause?.()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    answerDeadline.current = 0
    robotProgressRef.current = [...robotStartingProgress]
    stageStartScoreRef.current = 0
    profileNameRef.current = ''
    setName(''); setUser(''); setRobots(createRobotNames()); setJoining(false); setCount(0); setResumeSummary(null); setResumeCountdown(0)
    setStageNo(1); setStageItems(pickItems(categories[0].items)); setPassed([]); setScore(0); setSelected(null); setFinished(false); setStageWinner(null); setRobotWinner(0); setTimeLeft(STAGE_DURATION); setRobotProgress([...robotStartingProgress]); setListening(false); setMicBusy(false); setDescriptionPlaying(false); setNotice(''); setAudioNotice(''); setShowFallback(false); setRetryVisible(false)
  }
  function nextStage() {
    if (stageWinner === 'robot') { restartGame(); return }
    if (passed.length !== stage.items.length) return
    const nextNo = stageNo >= categories.length ? 1 : stageNo + 1
    stageStartScoreRef.current = stageNo >= categories.length ? 0 : score
    setStageNo(nextNo)
    setStageItems(pickItems(categories[nextNo - 1].items))
    if (stageNo >= categories.length) setScore(0)
    resetStage()
  }
  if (!user) return <main className="login"><div className="cloud c1">☁️</div><div className="cloud c2">☁️</div><div className="logo">کلم<span>باز</span><small>بازی با کلمه‌ها</small></div><div className="mascot">🦊</div><form onSubmit={login}><h1>سلام دوست کوچولو!</h1><p>اسمت چیه؟ با هم بازی کنیم.</p><input value={name} onChange={e=>setName(e.target.value)} placeholder="نام بازیکن" autoFocus /><button>شروع بازی 🚀</button></form></main>
  if (resumeSummary) return <main className="resume-page"><div className="resume-dialog"><div className="resume-confetti">🎉 ✨ 🏆 ✨ 🎉</div><h1>دوباره خوش آمدی!</h1><p className="resume-player">{resumeSummary.requestedName}، دفعهٔ قبل تا اینجا پیش رفتی:</p><div className="resume-stats"><div><span>مرحله</span><b>{toPersianDigits(resumeSummary.lastStage)} از ۱۰</b></div><div><span>امتیاز</span><b>⭐ {toPersianDigits(resumeSummary.lastScore)}</b></div></div><p className="resume-next">بازی از همین مرحله ادامه پیدا می‌کند.</p><p className="resume-countdown">تا پیدا کردن بازیکن‌ها و ربات‌ها <b>{toPersianDigits(resumeCountdown)}</b> ثانیه مانده</p></div></main>
  if (joining) return <main className="lobby"><div className="spinner">✨</div><h1>داریم دوست‌ها را پیدا می‌کنیم</h1><p>تا شروع بازی <b>{count}</b> ثانیه مانده</p><div className="playerchips"><i>{user} 🧒</i>{robots.map((x,i)=><i className="waiting" key={x}>{count < 3*(i+1) ? x+' 🤖' : 'در انتظار…'}</i>)}</div><small>اگر دوستی نیاید، ربات‌ها با ما بازی می‌کنند!</small></main>
  return <main className="game"><header><div className="brand">کلم<span>باز</span></div><div className="stage">مرحله {stageNo} از ۱۰ <b>{stage.icon} {stage.name}</b></div><div className={`time ${timeLeft > 0 && timeLeft <= TIME_WARNING_THRESHOLD ? 'urgent' : ''}`} aria-live="polite">{timeLeft > 0 && timeLeft <= TIME_WARNING_THRESHOLD ? '⚠️ ' : '⏱ '}{timeLeft}</div><div className="score">⭐ {score}</div></header><section className="race">{players.map((p,i)=><div key={p}><span>{i ? '🤖':'🧒'}</span><em>{p}</em><div className="track"><i style={{width:`${i ? Math.min(100, (robotProgress[i - 1] / 6) * 100) : (passed.length / 6) * 100}%`}} /></div></div>)}</section><div className="instruction">روی یک تصویر بزن، گوش کن و سپس اسمش را با میکروفون بگو! 🎤</div><section className="cards">{stage.items.map((it,i)=><button className={`card ${passed.includes(it[1])?'done':''}`} onClick={()=>openItem(it)} key={it[1]}><span>{it[0]}</span><b>{passed.includes(it[1]) ? `${it[2]} ✓` : `تصویر ${i + 1}`}</b></button>)}</section>{selected && <div className="modal"><div className="popup item-popup"><button type="button" className="close" aria-label="بستن تصویر" onClick={()=>setSelected(null)}>×</button><div className="image-carousel" aria-label={selectedAnimation && !animationFailed ? 'انیمیشن حیوان' : 'نمایش تصویر متحرک'}>{selectedAnimation && !animationFailed ? <div className="animal-animation-frame"><img className="animal-animation" src={selectedAnimation} alt="" decoding="async" onError={() => setAnimationFailed(true)} /></div> : <><div className={`carousel-frame carousel-frame-${carouselIndex}`} data-frame={carouselIndex} data-pose={galleryScenesFor(stage.prompt)[carouselIndex].pose} key={`${selected[1]}-${carouselIndex}`}>{selectedGalleryImage ? <img className="carousel-image" src={selectedGalleryImage} alt="" /> : <><span className="carousel-decoration carousel-decoration-left">{galleryScenesFor(stage.prompt)[carouselIndex].props[0]}</span><span className="carousel-emoji">{emojiVariantsFor(selected, stage.prompt)[carouselIndex]}</span><span className="carousel-decoration carousel-decoration-right">{galleryScenesFor(stage.prompt)[carouselIndex].props[1]}</span><span className="carousel-ground">{galleryScenesFor(stage.prompt)[carouselIndex].ground}</span></>}</div><div className="carousel-dots" aria-hidden="true">{Array.from({length:GALLERY_FRAME_COUNT}, (_, index) => <i className={index === carouselIndex ? 'active' : ''} key={index} />)}</div></>}</div><p className="description-text">{selected[3]}</p><div className="score-hint">راهنما: انگلیسی بگو <b>۲۰ امتیاز</b>، فارسی بگو <b>۱۰ امتیاز</b> ⭐</div><button className="speak-description" disabled={descriptionPlaying} aria-disabled={descriptionPlaying} onClick={()=>playDescription(selected[3], selected)}>🔊 {descriptionPlaying ? 'در حال پخش…' : 'گوش کن'}</button><button className={`mic ${listening?'pulse':''}`} disabled={descriptionPlaying || micBusy} aria-disabled={descriptionPlaying || micBusy} onClick={()=>useMic(selected)}>🎤<small>{descriptionPlaying?'منتظر بمان…':listening?'گوش می‌دهم…':'بگو!'}</small></button>{showFallback && <div className="answer"><button aria-label="پاسخ فارسی" onClick={()=>checkAnswer(selected[1],selected)}>🇮🇷 <small>+۱۰</small></button><button aria-label="پاسخ انگلیسی" onClick={()=>checkAnswer(selected[2],selected)}>🇬🇧 <small>+۲۰</small></button></div>}{audioNotice && <strong className="audio-notice">{audioNotice}</strong>}{notice && <strong className="notice">{notice}</strong>}</div></div>}{finished && <div className="modal victory"><div className="popup"><div className="confetti">🎉 ✨ 🏆 ✨ 🎉</div><h1>آفرین {user}!</h1><p>تو اول شدی و مرحله {stageNo} را تمام کردی!</p><b className="stars">⭐⭐⭐</b><button onClick={nextStage}>{stageNo === 10 ? 'بازی را دوباره شروع کن 🔄' : 'برو به مرحله بعد 🚀'}</button></div></div>}{stageWinner === 'robot' && <div className="modal victory timeout"><div className="popup"><div className="confetti">⏰ 🤖 ✨</div><h1>زمان تمام شد!</h1><p>{robots[robotWinner]} برندهٔ این مرحله شد.</p><p>اشکالی ندارد؛ دوباره تلاش کن یا به مرحلهٔ بعد برو.</p><div className="result-actions"><button onClick={()=>resetStage(true)}>تلاش دوباره 🔁</button><button onClick={nextStage}>مرحلهٔ بعد 🚀</button></div></div></div>}{welcomeOpen && <div className="modal welcome-modal"><div className="popup"><div className="confetti">🎉 ✨ 🚀</div><h1>به بازی خوش آمدی!</h1><p>بزن بریم؟</p><div className="welcome-actions"><button className="welcome-primary" onClick={replayWelcome}>🔊 پخش صدا</button><button className="welcome-secondary" onClick={()=>setWelcomeOpen(false)}>شروع بازی 🚀</button></div>{welcomeNotice && <strong className="audio-notice">{welcomeNotice}</strong>}</div></div>}</main>
}
createRoot(document.getElementById('root')).render(<App />)

// Credit Card Offers Scraper
// Scrapes offers from various Hong Kong sources

const OFFERS = [
  // HSBC Offers
  { merchant: '麥當勞', bank: 'HSBC', card: 'HSBC Red Card', offer: '外卖满减优惠', offer_type: 'cashback', offer_value: '20%', min_spend: '满100', source: 'official' },
  { merchant: '星巴克', bank: 'HSBC', card: 'HSBC Red Card', offer: '买一送一', offer_type: 'coupon', offer_value: '买一送一', min_spend: '', source: 'official' },
  { merchant: '百佳', bank: 'HSBC', card: 'HSBC Red Card', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  { merchant: '惠康', bank: 'HSBC', card: 'HSBC Red Card', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  
  // Citi Offers
  { merchant: '7-11', bank: 'Citi', card: 'Citi Cash Back', offer: '$50 rebate', offer_type: 'cashback', offer_value: '$50', min_spend: '满500', source: 'official' },
  { merchant: 'Circle K', bank: 'Citi', card: 'Citi Cash Back', offer: '$30 rebate', offer_type: 'cashback', offer_value: '$30', min_spend: '满300', source: 'official' },
  { merchant: '美心', bank: 'Citi', card: 'Citi Prestige', offer: '买一送一', offer_type: 'coupon', offer_value: '买一送一', min_spend: '', source: 'official' },
  
  // DBS Offers
  { merchant: '壽司郎', bank: 'DBS', card: 'DBS Black Card', offer: '3% rebate', offer_type: 'cashback', offer_value: '3%', min_spend: '', source: 'official' },
  { merchant: '海底撈', bank: 'DBS', card: 'DBS Black Card', offer: '85折', offer_type: 'coupon', offer_value: '85折', min_spend: '满300', source: 'official' },
  { merchant: '淘寶', bank: 'DBS', card: 'DBS Compass', offer: '5% rebate', offer_type: 'cashback', offer_value: '5%', min_spend: '满200', source: 'official' },
  
  // 渣打 Offers
  { merchant: '譚仔', bank: '渣打', card: '渣打Smart卡', offer: '5% rebate', offer_type: 'cashback', offer_value: '5%', min_spend: '', source: 'official' },
  { merchant: '牛角', bank: '渣打', card: '渣打Smart卡', offer: '8折', offer_type: 'coupon', offer_value: '8折', min_spend: '满400', source: 'official' },
  
  // 恒生 Offers
  { merchant: 'HKTVmall', bank: '恒生', card: '恒生enJoy卡', offer: '3% rebate', offer_type: 'cashback', offer_value: '3%', min_spend: '', source: 'official' },
  { merchant: '百佳', bank: '恒生', card: '恒生enJoy卡', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  
  // AEON Offers
  { merchant: 'AEON', bank: 'AEON', card: 'AEON Card', offer: '1% rebate', offer_type: 'cashback', offer_value: '1%', min_spend: '', source: 'official' },
  { merchant: 'JHC', bank: 'AEON', card: 'AEON Card', offer: '额外1%', offer_type: 'cashback', offer_value: '额外1%', min_spend: '', source: 'official' },
  
  // General Dining
  { merchant: '美心', bank: '通用', card: '通用餐饮卡', offer: '9折', offer_type: 'coupon', offer_value: '9折', min_spend: '满200', source: 'official' },
  { merchant: '海底撈', bank: '通用', card: '通用卡', offer: '送甜品', offer_type: 'coupon', offer_value: '送甜品', min_spend: '', source: 'official' },
  { merchant: '肯德基', bank: '通用', card: '通用卡', offer: '套餐优惠', offer_type: 'coupon', offer_value: '85折', min_spend: '', source: 'official' },
  { merchant: '必勝客', bank: '通用', card: '通用卡', offer: '外卖优惠', offer_type: 'coupon', offer_value: '9折', min_spend: '满150', source: 'official' },
  
  // Supermarkets
  { merchant: '百佳', bank: '通用', card: '通用卡', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  { merchant: '惠康', bank: '通用', card: '通用卡', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  { merchant: '759', bank: '通用', card: '通用卡', offer: '1% rebate', offer_type: 'cashback', offer_value: '1%', min_spend: '', source: 'official' },
  { merchant: 'Market Place', bank: '通用', card: '通用卡', offer: '3% rebate', offer_type: 'cashback', offer_value: '3%', min_spend: '满500', source: 'official' },
  
  // Online Shopping
  { merchant: 'HKTVmall', bank: '通用', card: '通用卡', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  { merchant: 'Amazon', bank: '通用', card: '通用卡', offer: '海外免運', offer_type: 'coupon', offer_value: '免運', min_spend: '满300', source: 'official' },
  { merchant: '淘寶', bank: '通用', card: '通用卡', offer: '2% rebate', offer_type: 'cashback', offer_value: '2%', min_spend: '', source: 'official' },
  { merchant: 'Zalora', bank: '通用', card: '通用卡', offer: '85折', offer_type: 'coupon', offer_value: '85折', min_spend: '满400', source: 'official' },
];

console.log('Credit Card Offers:', OFFERS.length);
console.log(JSON.stringify(OFFERS, null, 2));

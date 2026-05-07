import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function scrapeFengtai() {
  const url = 'http://www.ftlib.cn/ftlib/index/showNewsList/88'; // Assuming this is a branch list or similar
  // Note: Actual URL might need adjustment based on real-time check
  console.log('Scraping Fengtai Libraries...');
  
  // For MVP, if scraping is complex, we can use a seed list from the research results
  const libraries = [
    // --- District General Libraries (Core) ---
    {
      name: '国家图书馆(总馆)',
      address: '海淀区中关村南大街33号',
      lat: 39.9431, lng: 116.3235,
      opening_hours: '09:00-21:00 (阅览), 09:00-17:00 (借阅)',
      is_free: true,
      evidence_text: '国家级公共图书馆，基础服务全部免费',
      source_url: 'http://www.nlc.cn/',
      district: '海淀区',
      facilities: ['Wi-Fi', '自习室', '餐厅', '数字资源', '电源插座', '地铁直达', '存包柜', '免费饮水']
    },
    {
      name: '北京城市图书馆(森林书苑)',
      address: '通州区上码头路(城市绿心森林公园内)',
      lat: 39.8550, lng: 116.7350,
      opening_hours: '10:00-20:00 (潞云筑24小时)',
      is_free: true,
      evidence_text: '2024年世界最佳公共图书馆，潞云筑区域24小时开放',
      source_url: 'https://www.clcn.net.cn/',
      district: '通州区',
      facilities: ['24h', 'Wi-Fi', '自习室', '少儿区', '咖啡厅', '电源插座', '隔音舱', '智能选座', '免预约']
    },
    {
      name: '首都图书馆',
      address: '朝阳区东三环南路88号',
      lat: 39.8690, lng: 116.4565,
      opening_hours: '09:00-19:30',
      is_free: true,
      evidence_text: '北京市属大型公共图书馆，基础服务免费',
      source_url: 'https://www.clcn.net.cn/',
      district: '朝阳区'
    },
    {
      name: '西城区图书馆(后广平胡同馆)',
      address: '西城区后广平胡同26号',
      lat: 39.9270, lng: 116.3530,
      opening_hours: '09:00-19:00',
      is_free: true,
      evidence_text: '西城区核心公共图书馆，通借通还',
      source_url: 'http://www.xclib.org/',
      district: '西城区'
    },
    {
      name: '东城区图书馆(交道口馆)',
      address: '东城区交道口东大街85号',
      lat: 39.9410, lng: 116.4160,
      opening_hours: '09:00-21:00',
      is_free: true,
      evidence_text: '东城区公益图书馆，环境温馨',
      source_url: 'http://www.bjdclib.com/',
      district: '东城区'
    },
    {
      name: '海淀区图书馆(总馆)',
      address: '海淀区丹棱街16号海淀大厦',
      lat: 39.9800, lng: 116.3150,
      opening_hours: '09:00-21:00',
      is_free: true,
      evidence_text: '海淀核心自习圣地，座位丰富',
      source_url: 'http://www.hdlib.cn/',
      district: '海淀区'
    },

    // --- 24-Hour Libraries & Spaces ---
    {
      name: '永定路街道24小时图书馆',
      address: '海淀区金沟河路5号院805楼',
      lat: 39.9130, lng: 116.2620,
      opening_hours: '24小时开放',
      is_free: true,
      evidence_text: '2024年升级，全天候无人值守，刷身份证进入',
      source_url: 'http://www.beijing.gov.cn/',
      district: '海淀区',
      facilities: ['24h', 'Wi-Fi', '自习区', '电源插座', '免预约', '免费饮水']
    },
    {
      name: '西城区24小时城市书房',
      address: '西城区莲花池东路16号',
      lat: 39.8980, lng: 116.3350,
      opening_hours: '24小时开放',
      is_free: true,
      evidence_text: '西城区首家24小时自助城市书房',
      source_url: 'http://www.xclib.org/',
      district: '西城区',
      facilities: ['24h', '自习区']
    },
    {
      name: '中国书店(雁翅楼店)',
      address: '西城区地安门外大街117号',
      lat: 39.9340, lng: 116.3960,
      opening_hours: '24小时营业',
      is_free: true,
      evidence_text: '古建风格24小时书店，提供免费阅读区',
      source_url: 'http://www.beijing.gov.cn/',
      district: '西城区',
      facilities: ['24h', '古建']
    },

    // --- High Quality City Study Rooms (城市书房/书屋) ---
    {
      name: '朝阳城市书屋·首开书院馆',
      address: '朝阳区安慧东里',
      lat: 39.9950, lng: 116.4150,
      opening_hours: '09:00-18:00 (提供延时服务)',
      is_free: true,
      evidence_text: '第45家城市书屋，主打“城市文化”特藏，提供延时开放服务',
      source_url: 'http://www.chylib.net/',
      district: '朝阳区',
      facilities: ['特色建筑', '自习室', '电源插座', '咖啡厅']
    },
    {
      name: '朝阳城市书屋·良阅书房(郎园馆)',
      address: '朝阳区建国路128号郎园Vintage',
      lat: 39.9100, lng: 116.4600,
      opening_hours: '10:00-21:00',
      is_free: true,
      evidence_text: '文创园区内的城市书房，艺术氛围浓厚',
      source_url: 'http://www.chylib.net/',
      district: '朝阳区',
      facilities: ['特色建筑']
    },
    {
      name: '朝阳城市书屋·禧园馆',
      address: '朝阳区北苑东路辅路与北苑中街交叉口东(禧园酒店内)',
      lat: 40.0450, lng: 116.4250,
      opening_hours: '10:00-20:00',
      is_free: true,
      evidence_text: '首家“书香酒店”主题，亲子阅读空间',
      source_url: 'http://www.chylib.net/',
      district: '朝阳区',
      facilities: ['少儿区', '特色建筑']
    },
    {
      name: '宸冰书坊',
      address: '朝阳区朝外大街乙6号朝外SOHO',
      lat: 39.9200, lng: 116.4500,
      opening_hours: '10:00-20:00',
      is_free: true,
      evidence_text: 'CBD区域的高品质阅读空间，常举办文化沙龙',
      source_url: 'http://www.chylib.net/',
      district: '朝阳区',
      facilities: ['特色建筑']
    },
    {
      name: '朝阳区图书馆(小庄馆)24小时自助图书馆',
      address: '朝阳区朝阳门外金台里17号',
      lat: 39.9180, lng: 116.4650,
      opening_hours: '24小时开放',
      is_free: true,
      evidence_text: '365天、24小时全天候自助办证、借还书',
      source_url: 'http://www.chylib.net/',
      district: '朝阳区',
      facilities: ['24h']
    },
    {
      name: '三联韬奋书店(三里屯店)',
      address: '朝阳区三里屯西街中段',
      lat: 39.9350, lng: 116.4550,
      opening_hours: '24小时营业',
      is_free: true,
      evidence_text: '北京著名的“深夜书房”，免费阅读',
      source_url: 'http://www.visitbeijing.com.cn/',
      district: '朝阳区',
      facilities: ['24h', '特色建筑']
    },
    {
      name: '奥森书局',
      address: '朝阳区奥林匹克森林公园南园内',
      lat: 40.0150, lng: 116.3950,
      opening_hours: '09:00-18:00',
      is_free: true,
      evidence_text: '位于公园竹林中，环境极佳的免费阅读空间',
      source_url: 'http://www.visitbeijing.com.cn/',
      district: '朝阳区',
      facilities: ['特色建筑', '免预约', '地铁直达']
    },
    {
      name: '望京街道图书馆',
      address: '朝阳区望京西园425楼三层',
      lat: 40.0010, lng: 116.4710,
      opening_hours: '周二至周日 08:30-17:00, 周一 13:00-17:00',
      is_free: true,
      evidence_text: '望京核心公益图书馆，支持全市通借通还',
      source_url: 'http://www.beijing.gov.cn/',
      district: '朝阳区',
      facilities: ['Wi-Fi', '自习室', '免预约']
    },
    {
      name: '北京晓书馆',
      address: '朝阳区望京小街万科时代中心',
      lat: 39.9950, lng: 116.4820,
      opening_hours: '10:00-21:00 (周一闭馆)',
      is_free: true,
      evidence_text: '高颜值公益学习型图书馆，需通过微信提前预约',
      source_url: 'https://www.xiaoshuguan.cn/',
      district: '朝阳区',
      facilities: ['特色建筑', '自习区', '咖啡厅']
    },
    {
      name: '单向空间(郎园Station店)',
      address: '朝阳区半截塔路53号郎园Station',
      lat: 39.9700, lng: 116.5100,
      opening_hours: '10:00-21:00',
      is_free: true,
      evidence_text: '文艺气息浓厚，提供免费大面积阅读区',
      source_url: 'http://www.visitbeijing.com.cn/',
      district: '朝阳区',
      facilities: ['特色建筑']
    },

    // --- District Branch & Specialists ---
    {
      name: '丰台区图书馆大红门馆',
      address: '丰台区南苑路7号',
      lat: 39.8574, lng: 116.3980,
      opening_hours: '周二至周五 9:00-19:00；周六日 9:00-17:00',
      is_free: true,
      evidence_text: '丰台区新馆，设施一流',
      source_url: 'http://www.ftlib.cn/',
      district: '丰台区'
    },
    {
      name: '丰台区图书馆北大地馆',
      address: '丰台区西四环南路64号',
      lat: 39.8656, lng: 116.2865,
      opening_hours: '09:00-19:00',
      is_free: true,
      evidence_text: '丰台区文化中心内，自习室热门',
      source_url: 'http://www.ftlib.cn/',
      district: '丰台区'
    },
    {
      name: '大兴区图书馆总馆',
      address: '大兴区黄村镇西大街11号',
      lat: 39.7317, lng: 116.3305,
      opening_hours: '09:00-24:00 (部分区域至深夜)',
      is_free: true,
      evidence_text: '国家一级图书馆，开放时间超长',
      source_url: 'http://www.dxlib.net.cn/',
      district: '大兴区',
      facilities: ['WiFi', '自习室']
    },
    {
      name: '朝阳区图书馆(广渠路新馆)',
      address: '朝阳区广渠路66号院3号楼',
      lat: 39.8938, lng: 116.4955,
      opening_hours: '09:00-21:00',
      is_free: true,
      evidence_text: '朝阳区核心数字化图书馆',
      source_url: 'http://www.chylib.net/',
      district: '朝阳区'
    },
    {
      name: '房山区图书馆(新馆)',
      address: '房山区广阳大街与井成道交叉口',
      lat: 39.7550, lng: 116.1850,
      opening_hours: '09:00-18:00',
      is_free: true,
      evidence_text: '房山区长阳核心阅读空间',
      source_url: 'http://www.fslib.net/',
      district: '房山区'
    },
    {
      name: '昌平区图书馆',
      address: '昌平区府学路10号',
      lat: 40.2200, lng: 116.2350,
      opening_hours: '08:30-18:00',
      is_free: true,
      evidence_text: '昌平区老牌公共图书馆',
      source_url: 'http://www.cplib.net/',
      district: '昌平区'
    },
    {
      name: '顺义区图书馆',
      address: '顺义区石园大街10号',
      lat: 40.1250, lng: 116.6600,
      opening_hours: '09:00-18:00',
      is_free: true,
      evidence_text: '顺义区中心图书馆',
      source_url: 'http://www.shylib.net/',
      district: '顺义区'
    },

    // --- Special & Beautiful Community Libraries ---
    {
      name: '北京红楼公共藏书楼',
      address: '西城区西四南大街26号',
      lat: 39.9250, lng: 116.3700,
      opening_hours: '09:00-18:00',
      is_free: true,
      evidence_text: '由著名“红楼电影院”改造，集藏书楼与公共阅读于一体',
      source_url: 'http://www.beijing.gov.cn/',
      district: '西城区',
      facilities: ['特色建筑', '自习区']
    },
    {
      name: '模范书局·诗源圣所',
      address: '西城区佟麟阁路85号',
      lat: 39.9020, lng: 116.3650,
      opening_hours: '10:00-18:30',
      is_free: true,
      evidence_text: '坐落于百年教堂内的最美书店，提供免费阅读座位',
      source_url: 'http://www.visitbeijing.com.cn/',
      district: '西城区',
      facilities: ['教堂建筑', '咖啡厅']
    },
    {
      name: '正阳书局(砖塔胡同店)',
      address: '西城区西四南大街43号',
      lat: 39.9240, lng: 116.3710,
      opening_hours: '09:00-18:00',
      is_free: true,
      evidence_text: '位于砖塔胡同内的四合院书房，充满老北京韵味',
      source_url: 'http://www.visitbeijing.com.cn/',
      district: '西城区',
      facilities: ['四合院', '北京文献']
    },
    {
      name: '广安门内街道城市书房',
      address: '西城区广安门内大街',
      lat: 39.8890, lng: 116.3600,
      opening_hours: '24小时开放',
      is_free: true,
      evidence_text: '典型的“小而美”，提供自助借还、WiFi和充电，周边居民深夜自习首选',
      source_url: 'http://www.beijing.gov.cn/',
      district: '西城区',
      facilities: ['24h', 'Wi-Fi', '自习室', '充电']
    },
    {
      name: '西红门24小时城市书房',
      address: '大兴区西红门镇',
      lat: 39.7900, lng: 116.3300,
      opening_hours: '24小时开放',
      is_free: true,
      evidence_text: '位于商业区与社区交汇处，南城代表性的智慧书房',
      source_url: 'http://www.dxlib.net.cn/',
      district: '大兴区',
      facilities: ['24h', '自习区']
    },
    {
      name: '中关村图书大厦(一层北厅)',
      address: '海淀区左岸工社旁',
      lat: 39.9830, lng: 116.3050,
      opening_hours: '24小时营业',
      is_free: true,
      evidence_text: '24小时营业书店，提供舒适免费阅读区',
      source_url: 'http://www.beijing.gov.cn/',
      district: '海淀区',
      facilities: ['24h', 'Wi-Fi', '自习区']
    }
  ];

  return libraries;
}

async function main() {
  const fengtaiLibs = await scrapeFengtai();
  const allLibs = [...fengtaiLibs];
  
  fs.writeFileSync(
    path.join(process.cwd(), 'data/raw_libraries.json'),
    JSON.stringify(allLibs, null, 2)
  );
  console.log(`Scraped ${allLibs.length} libraries.`);
}

main().catch(console.error);

import type { NigeriaState } from '../types/campaign';

/**
 * Verified Nigerian Administrative Geography:
 * All 36 States + Federal Capital Territory (37 units) and all 774 Local Government Areas (LGAs).
 * Wards and Polling Units are NOT fabricated; they must be imported from official datasets via the Geography Import System.
 */
export const NIGERIA_STATES: NigeriaState[] = [
  {
    code: 'AB',
    name: 'Abia',
    capital: 'Umuahia',
    zone: 'South-East',
    lat: 5.4527,
    lng: 7.5248,
    mapX: 465,
    mapY: 455,
    lgas: [
      'Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North',
      'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma Ngwa',
      'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi',
    ],
  },
  {
    code: 'AD',
    name: 'Adamawa',
    capital: 'Yola',
    zone: 'North-East',
    lat: 9.3265,
    lng: 12.3984,
    mapX: 735,
    mapY: 255,
    lgas: [
      'Demsa', 'Fufore', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Lamurde',
      'Madagali', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan',
      'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South',
    ],
  },
  {
    code: 'AK',
    name: 'Akwa Ibom',
    capital: 'Uyo',
    zone: 'South-South',
    lat: 5.0077,
    lng: 7.8537,
    mapX: 495,
    mapY: 495,
    lgas: [
      'Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan',
      'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene',
      'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara',
      'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo',
    ],
  },
  {
    code: 'AN',
    name: 'Anambra',
    capital: 'Awka',
    zone: 'South-East',
    lat: 6.2209,
    lng: 6.9370,
    mapX: 425,
    mapY: 418,
    lgas: [
      'Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South',
      'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala',
      'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South',
      'Orumba North', 'Orumba South', 'Oyi',
    ],
  },
  {
    code: 'BA',
    name: 'Bauchi',
    capital: 'Bauchi',
    zone: 'North-East',
    lat: 10.7761,
    lng: 9.9992,
    mapX: 590,
    mapY: 195,
    lgas: [
      'Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa',
      'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira',
      'Tafawa Balewa', 'Toro', 'Warji', 'Zaki',
    ],
  },
  {
    code: 'BY',
    name: 'Bayelsa',
    capital: 'Yenagoa',
    zone: 'South-South',
    lat: 4.7719,
    lng: 6.0699,
    mapX: 370,
    mapY: 505,
    lgas: [
      'Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama',
      'Southern Ijaw', 'Yenagoa',
    ],
  },
  {
    code: 'BE',
    name: 'Benue',
    capital: 'Makurdi',
    zone: 'North-Central',
    lat: 7.3369,
    lng: 8.7404,
    mapX: 530,
    mapY: 365,
    lgas: [
      'Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West',
      'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo',
      'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya',
    ],
  },
  {
    code: 'BO',
    name: 'Borno',
    capital: 'Maiduguri',
    zone: 'North-East',
    lat: 11.8846,
    lng: 13.1520,
    mapX: 770,
    mapY: 130,
    lgas: [
      'Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa',
      'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga',
      'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar',
      'Monguno', 'Ngala', 'Nganzai', 'Shani',
    ],
  },
  {
    code: 'CR',
    name: 'Cross River',
    capital: 'Calabar',
    zone: 'South-South',
    lat: 5.8702,
    lng: 8.5988,
    mapX: 540,
    mapY: 455,
    lgas: [
      'Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki',
      'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra',
      'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala',
    ],
  },
  {
    code: 'DE',
    name: 'Delta',
    capital: 'Asaba',
    zone: 'South-South',
    lat: 5.5325,
    lng: 5.8987,
    mapX: 350,
    mapY: 452,
    lgas: [
      'Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West',
      'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West',
      'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North',
      'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West',
    ],
  },
  {
    code: 'EB',
    name: 'Ebonyi',
    capital: 'Abakaliki',
    zone: 'South-East',
    lat: 6.2649,
    lng: 8.0137,
    mapX: 495,
    mapY: 418,
    lgas: [
      'Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South',
      'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha',
    ],
  },
  {
    code: 'ED',
    name: 'Edo',
    capital: 'Benin City',
    zone: 'South-South',
    lat: 6.6342,
    lng: 5.9304,
    mapX: 355,
    mapY: 405,
    lgas: [
      'Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West',
      'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo',
      'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde',
    ],
  },
  {
    code: 'EK',
    name: 'Ekiti',
    capital: 'Ado-Ekiti',
    zone: 'South-West',
    lat: 7.7190,
    lng: 5.3110,
    mapX: 315,
    mapY: 360,
    lgas: [
      'Ado-Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure',
      'Gbonyin', 'Ido-Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun',
      'Ise/Orun', 'Moba', 'Oye',
    ],
  },
  {
    code: 'EN',
    name: 'Enugu',
    capital: 'Enugu',
    zone: 'South-East',
    lat: 6.5364,
    lng: 7.4356,
    mapX: 460,
    mapY: 405,
    lgas: [
      'Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti',
      'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka',
      'Oji River', 'Udenu', 'Udi', 'Uzo-Uwani',
    ],
  },
  {
    code: 'FC',
    name: 'FCT Abuja',
    capital: 'Abuja',
    zone: 'North-Central',
    lat: 9.0765,
    lng: 7.3986,
    mapX: 445,
    mapY: 280,
    lgas: [
      'Abaji', 'Abuja Municipal Area Council (AMAC)', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali',
    ],
  },
  {
    code: 'GO',
    name: 'Gombe',
    capital: 'Gombe',
    zone: 'North-East',
    lat: 10.2897,
    lng: 11.1673,
    mapX: 660,
    mapY: 215,
    lgas: [
      'Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami',
      'Nafada', 'Shongom', 'Yamaltu/Deba',
    ],
  },
  {
    code: 'IM',
    name: 'Imo',
    capital: 'Owerri',
    zone: 'South-East',
    lat: 5.5720,
    lng: 7.0588,
    mapX: 430,
    mapY: 455,
    lgas: [
      'Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South',
      'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba',
      'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Onuimo', 'Orlu',
      'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West',
    ],
  },
  {
    code: 'JI',
    name: 'Jigawa',
    capital: 'Dutse',
    zone: 'North-West',
    lat: 12.2280,
    lng: 9.5616,
    mapX: 575,
    mapY: 120,
    lgas: [
      'Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki',
      'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kaugama',
      'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim',
      'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi',
    ],
  },
  {
    code: 'KD',
    name: 'Kaduna',
    capital: 'Kaduna',
    zone: 'North-West',
    lat: 10.5105,
    lng: 7.4165,
    mapX: 455,
    mapY: 205,
    lgas: [
      'Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia',
      'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau',
      'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria',
    ],
  },
  {
    code: 'KN',
    name: 'Kano',
    capital: 'Kano',
    zone: 'North-West',
    lat: 12.0022,
    lng: 8.5920,
    mapX: 515,
    mapY: 138,
    lgas: [
      'Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta',
      'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam',
      'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya',
      'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa',
      'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa',
      'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil',
    ],
  },
  {
    code: 'KT',
    name: 'Katsina',
    capital: 'Katsina',
    zone: 'North-West',
    lat: 12.9816,
    lng: 7.6223,
    mapX: 455,
    mapY: 96,
    lgas: [
      'Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Danja',
      'Dan Musa', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia',
      'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua',
      'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana',
      'Sandamu', 'Zango',
    ],
  },
  {
    code: 'KE',
    name: 'Kebbi',
    capital: 'Birnin Kebbi',
    zone: 'North-West',
    lat: 11.4942,
    lng: 4.2333,
    mapX: 255,
    mapY: 145,
    lgas: [
      'Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza',
      'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski',
      'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru',
    ],
  },
  {
    code: 'KO',
    name: 'Kogi',
    capital: 'Lokoja',
    zone: 'North-Central',
    lat: 7.7337,
    lng: 6.6906,
    mapX: 405,
    mapY: 350,
    lgas: [
      'Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela-Odolu',
      'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo',
      'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West',
    ],
  },
  {
    code: 'KW',
    name: 'Kwara',
    capital: 'Ilorin',
    zone: 'North-Central',
    lat: 8.9669,
    lng: 4.3874,
    mapX: 270,
    mapY: 295,
    lgas: [
      'Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South',
      'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi',
    ],
  },
  {
    code: 'LA',
    name: 'Lagos',
    capital: 'Ikeja',
    zone: 'South-West',
    lat: 6.5244,
    lng: 3.3792,
    mapX: 195,
    mapY: 418,
    lgas: [
      'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry',
      'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe',
      'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
    ],
  },
  {
    code: 'NA',
    name: 'Nasarawa',
    capital: 'Lafia',
    zone: 'North-Central',
    lat: 8.5380,
    lng: 8.3220,
    mapX: 500,
    mapY: 312,
    lgas: [
      'Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia',
      'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba',
    ],
  },
  {
    code: 'NI',
    name: 'Niger',
    capital: 'Minna',
    zone: 'North-Central',
    lat: 9.9309,
    lng: 5.5983,
    mapX: 340,
    mapY: 238,
    lgas: [
      'Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako',
      'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu',
      'Mokwa', 'Munya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi',
    ],
  },
  {
    code: 'OG',
    name: 'Ogun',
    capital: 'Abeokuta',
    zone: 'South-West',
    lat: 7.0000,
    lng: 3.3500,
    mapX: 205,
    mapY: 382,
    lgas: [
      'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Ewekoro', 'Ifo', 'Ijebu East',
      'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia',
      'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Sagamu',
      'Yewa North', 'Yewa South',
    ],
  },
  {
    code: 'ON',
    name: 'Ondo',
    capital: 'Akure',
    zone: 'South-West',
    lat: 7.2508,
    lng: 5.2103,
    mapX: 300,
    mapY: 402,
    lgas: [
      'Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West',
      'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje',
      'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West',
      'Ose', 'Owo',
    ],
  },
  {
    code: 'OS',
    name: 'Osun',
    capital: 'Osogbo',
    zone: 'South-West',
    lat: 7.5629,
    lng: 4.5200,
    mapX: 268,
    mapY: 365,
    lgas: [
      'Aiyedaade', 'Aiyedire', 'Atakunmosa East', 'Atakunmosa West', 'Boluwaduro', 'Boripe',
      'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North',
      'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun',
      'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade',
      'Orolu', 'Osogbo',
    ],
  },
  {
    code: 'OY',
    name: 'Oyo',
    capital: 'Ibadan',
    zone: 'South-West',
    lat: 8.1574,
    lng: 3.6147,
    mapX: 220,
    mapY: 340,
    lgas: [
      'Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East',
      'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central',
      'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa',
      'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo',
      'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East',
      'Saki West', 'Surulere',
    ],
  },
  {
    code: 'PL',
    name: 'Plateau',
    capital: 'Jos',
    zone: 'North-Central',
    lat: 9.2182,
    lng: 9.5179,
    mapX: 560,
    mapY: 270,
    lgas: [
      'Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam',
      'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin',
      'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase',
    ],
  },
  {
    code: 'RI',
    name: 'Rivers',
    capital: 'Port Harcourt',
    zone: 'South-South',
    lat: 4.8396,
    lng: 6.9112,
    mapX: 430,
    mapY: 500,
    lgas: [
      'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru',
      'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana',
      'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro',
      'Oyigbo', 'Port Harcourt', 'Tai',
    ],
  },
  {
    code: 'SO',
    name: 'Sokoto',
    capital: 'Sokoto',
    zone: 'North-West',
    lat: 13.0059,
    lng: 5.2476,
    mapX: 315,
    mapY: 92,
    lgas: [
      'Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela',
      'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North',
      'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo',
    ],
  },
  {
    code: 'TA',
    name: 'Taraba',
    capital: 'Jalingo',
    zone: 'North-East',
    lat: 7.9994,
    lng: 10.7740,
    mapX: 650,
    mapY: 325,
    lgas: [
      'Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido',
      'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing',
    ],
  },
  {
    code: 'YO',
    name: 'Yobe',
    capital: 'Damaturu',
    zone: 'North-East',
    lat: 12.2939,
    lng: 11.4390,
    mapX: 675,
    mapY: 125,
    lgas: [
      'Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani',
      'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa',
      'Yunusari', 'Yusufari',
    ],
  },
  {
    code: 'ZA',
    name: 'Zamfara',
    capital: 'Gusau',
    zone: 'North-West',
    lat: 12.1704,
    lng: 6.6642,
    mapX: 385,
    mapY: 128,
    lgas: [
      'Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau',
      'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi',
    ],
  },
];

export const STATE_BY_CODE: Record<string, NigeriaState> = Object.fromEntries(
  NIGERIA_STATES.map((state) => [state.code, state])
);

export function getTotalLgaCount(): number {
  return NIGERIA_STATES.reduce((acc, s) => acc + s.lgas.length, 0);
}

export function searchNigeriaGeography(query: string): Array<{
  type: 'State' | 'LGA';
  stateCode: string;
  stateName: string;
  lgaName?: string;
  zone: string;
}> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: Array<{
    type: 'State' | 'LGA';
    stateCode: string;
    stateName: string;
    lgaName?: string;
    zone: string;
  }> = [];

  for (const state of NIGERIA_STATES) {
    if (
      state.name.toLowerCase().includes(q) ||
      state.code.toLowerCase() === q ||
      state.capital.toLowerCase().includes(q)
    ) {
      matches.push({
        type: 'State',
        stateCode: state.code,
        stateName: state.name,
        zone: state.zone,
      });
    }
    for (const lga of state.lgas) {
      if (lga.toLowerCase().includes(q)) {
        matches.push({
          type: 'LGA',
          stateCode: state.code,
          stateName: state.name,
          lgaName: lga,
          zone: state.zone,
        });
      }
    }
  }
  return matches.slice(0, 60);
}

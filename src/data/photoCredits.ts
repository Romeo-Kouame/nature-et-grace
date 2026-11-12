/**
 * Crédits des photos d’illustration (dossier public/photos), toutes issues de Wikimedia Commons
 * sous licence libre. Les licences CC BY et CC BY-SA imposent de citer l’auteur : cette liste
 * est affichée sur la page « Mentions légales ». À retirer quand les photos de la marque les remplacent.
 */
export type PhotoCredit = { file: string; title: string; author: string; license: string; source: string }

export const PHOTO_CREDITS: PhotoCredit[] = [
  { file: 'p-beurre-cacao-brut.webp', title: 'Cocoa Butter (8612673294)', author: 'Veganbaking.net from USA', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_Butter_(8612673294).jpg' },
  { file: 'p-beurre-cacao-brut-2.webp', title: 'Cocoa butter p1410148', author: 'David Monniaux', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_butter_p1410148.JPG' },
  { file: 'p-chantilly-cacao.webp', title: 'Cocoa butter', author: 'Rebeccananonof', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_butter.jpg' },
  { file: 'p-beurre-cacao-250.webp', title: 'Cacao oleum1', author: 'Maša Sinreih in Valentina Vivod', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Cacao_oleum1.JPG' },
  { file: 'p-pastilles-cacao.webp', title: 'Cacao oleum2', author: 'Maša Sinreih in Valentina Vivod', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Cacao_oleum2.JPG' },
  { file: 'p-baume-levres.webp', title: 'Cocoa butter in a tins', author: 'Rebeccananonof', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_butter_in_a_tins.jpg' },
  { file: 'p-masque-cacao.webp', title: 'Cocoa Mass', author: 'norikunny', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_Mass.JPG' },
  { file: 'p-gommage-feves.webp', title: 'Cocoa bean roasted2', author: 'voir la page source', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_bean_roasted2.jpg' },
  { file: 'p-savon-cabosse.webp', title: 'Alata samina', author: 'Darkemperror', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Alata_samina.jpg' },
  { file: 'p-savon-karite.webp', title: 'Savon noir', author: 'Ndeyemami', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Savon_noir.jpg' },
  { file: 'p-savon-pain.webp', title: 'Black soap and natural homemade soaps', author: 'Kolobetsoo', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Black_soap_and_natural_homemade_soaps.jpg' },
  { file: 'p-karite-brut.webp', title: 'A bolw of Shea Butter', author: 'Maltima Rabia', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:A_bolw_of_Shea_Butter.jpg' },
  { file: 'p-karite-fouette.webp', title: 'Mélange du Beurre de karité et huiles essentielles dans une boite pour massage 01', author: 'Adoscam', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:M%C3%A9lange_du_Beurre_de_karit%C3%A9_et_huiles_essentielles_dans_une_boite_pour_massage_01.jpg' },
  { file: 'p-karite-fouette-2.webp', title: 'Mélange du Beurre de karité et huiles essentielles dans une boite pour massage 03', author: 'Adoscam', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:M%C3%A9lange_du_Beurre_de_karit%C3%A9_et_huiles_essentielles_dans_une_boite_pour_massage_03.jpg' },
  { file: 'p-karite-boules.webp', title: 'Shea Butter balls', author: 'Hanay', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Shea_Butter_balls.jpg' },
  { file: 'p-karite-dore.webp', title: 'Shea butter 4', author: 'Achiri Bitamsimli', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Shea_butter_4.jpg' },
  { file: 'p-karite-pur.webp', title: 'Naturally Processed Shea Butter 2', author: 'Dhee jah', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Naturally_Processed_Shea_Butter_2.jpg' },
  { file: 'p-huile-coco.webp', title: 'Noix de coco de culture biologique de Côte d’Ivoire, dans une boutique du onzième arrondissement de Paris, France', author: 'Teknad', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Noix_de_coco_de_culture_biologique_de_C%C3%B4te_d%27Ivoire,_dans_une_boutique_du_onzi%C3%A8me_arrondissement_de_Paris,_France.jpg' },
  { file: 'p-huile-coco-2.webp', title: 'Cabosse de coco', author: 'BeraDigle', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cabosse_de_coco.jpg' },
  { file: 'p-huile-palmiste.webp', title: 'Palm kernel 1', author: 'Stephanie cheks', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Palm_kernel_1.jpg' },
  { file: 'p-huile-palmiste-2.webp', title: 'Palm Kernel Fruits on a Bowl', author: 'ArtoftheArtist IAm', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Palm_Kernel_Fruits_on_a_Bowl.jpg' },
  { file: 'p-huile-baobab.webp', title: 'Baobab-oil-1020957 1280', author: 'saponifier', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Baobab-oil-1020957_1280.jpg' },
  { file: 'p-huile-karite.webp', title: 'Vitellaria paradoxa MS 3765', author: 'Marco Schmidt [1]', license: 'CC BY-SA 2.5', source: 'https://commons.wikimedia.org/wiki/File:Vitellaria_paradoxa_MS_3765.jpg' },
  { file: 'p-bissap.webp', title: 'Bissap - gourd calabash with dried leaves, Hibiscus sabdariffa', author: 'T.K. Naliaka', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Bissap_-_gourd_calabash_with_dried_leaves,_Hibiscus_sabdariffa.jpg' },
  { file: 'p-bissap-2.webp', title: 'Bissap ou fleur d’hibiscus sabdariffa 2', author: 'BorisAhonon', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Bissap_ou_fleur_d%27hibiscus_sabdariffa_2.jpg' },
  { file: 'p-coffret-cacao.webp', title: 'Cacao de Côte d’Ivoire 01', author: 'Aman ADO', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cacao_de_C%C3%B4te_d%27Ivoire_01.jpg' },
  { file: 'p-coffret-karite.webp', title: 'Shea butter 2024', author: 'Vision L1', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Shea_butter_2024.jpg' },
  { file: 'a-hero.webp', title: 'Cocoa pods in Soubré', author: 'Milequem Diarassouba', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cocoa_pods_in_Soubr%C3%A9.jpg' },
  { file: 'a-cabosse.webp', title: 'Cacao fruit in Côte d’Ivoire (8)', author: 'Hanay', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cacao_fruit_in_C%C3%B4te_d%27Ivoire_(8).JPG' },
  { file: 'a-cabosse-ouverte.webp', title: 'Cabosse de cacao ouverte', author: 'Blackaguila', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cabosse_de_cacao_ouverte.jpg' },
  { file: 'a-plantation.webp', title: 'Cacao-realisatrice-mansita-konate-wiki-loves-africa-cote-divoire-fan-club-5', author: 'Numerik-3325', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cacao-realisatrice-mansita-konate-wiki-loves-africa-cote-divoire-fan-club-5.jpg' },
  { file: 'a-karite-femmes.webp', title: 'USAID in Ghana Shea Butter Processing (27709526618)', author: 'USAID in Africa', license: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File:USAID_in_Ghana_Shea_Butter_Processing_(27709526618).jpg' },
  { file: 'a-karite-marche.webp', title: 'Shea Butter Sellers', author: 'Ibn Shiraz', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Shea_Butter_Sellers.jpg' },
  { file: 'a-noix-karite.webp', title: 'Shea nuts june', author: 'Seimawu Sugri Seidu', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Shea_nuts_june.jpg' },
  { file: 'a-cacao-panier.webp', title: 'Cacao de Côte d’Ivoire 02', author: 'Aman ADO', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cacao_de_C%C3%B4te_d%27Ivoire_02.jpg' },
]

import andriana from '@/assets/images/brands/andriana.jpeg';
import carnage from '@/assets/images/brands/carnage.webp';
import ekko from '@/assets/images/brands/ekko.png';
import envogue from '@/assets/images/brands/envogue.webp';
import gflock from '@/assets/images/brands/gflock.jpeg';
import hadaLadies from '@/assets/images/brands/hada.png';
import hustle from '@/assets/images/brands/hustle.png';
import jezza from '@/assets/images/brands/jezza.png';
import joey from '@/assets/images/brands/joey.png';
import kingStreet from '@/assets/images/brands/kingstreet.png';
import mimosa from '@/assets/images/brands/mimosa.png';
import modano from '@/assets/images/brands/modano.png';
import mooseClothing from '@/assets/images/brands/moose.png';
import nilsStore from '@/assets/images/brands/nils.jpeg';
import noLimit from '@/assets/images/brands/nolimit.jpeg';
import odel from '@/assets/images/brands/odel.jpg';
import pinkElephant from '@/assets/images/brands/pink-elephant.png';

export type BrandLogo = {
  key: string;
  name: string;
  src: string;
  aliases: string[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const BRAND_LOGOS: BrandLogo[] = [
  { key: 'andriana', name: 'ANDRIANA', src: andriana, aliases: ['ANDRIANA'] },
  { key: 'carnage', name: 'CARNAGE', src: carnage, aliases: ['CARNAGE'] },
  { key: 'ekko', name: 'EKKO', src: ekko, aliases: ['EKKO'] },
  { key: 'envogue', name: 'Envogue', src: envogue, aliases: ['Envogue'] },
  { key: 'gflock', name: 'GFLOCK', src: gflock, aliases: ['GFLOCK'] },
  { key: 'hada-ladies', name: 'Hada Ladies', src: hadaLadies, aliases: ['Hada Ladies', 'Hada'] },
  { key: 'hustle', name: 'Hustle', src: hustle, aliases: ['Hustle'] },
  { key: 'jezza', name: 'Jezza', src: jezza, aliases: ['Jezza'] },
  { key: 'joey', name: 'Joey', src: joey, aliases: ['JOEY', 'Joey Clothing'] },
  { key: 'king-street', name: 'King Street', src: kingStreet, aliases: ['King Street'] },
  { key: 'mimosa', name: 'Mimosa', src: mimosa, aliases: ['Mimosa', 'MEMOSA', 'Minoza'] },
  { key: 'modano', name: 'MODANO', src: modano, aliases: ['MODANO'] },
  { key: 'moose-clothing', name: 'Moose Clothing', src: mooseClothing, aliases: ['Moose Clothing', 'Moose'] },
  { key: 'nils-store', name: 'nils store', src: nilsStore, aliases: ['nils store', 'Nils Store'] },
  { key: 'nolimit', name: 'NOLIMIT', src: noLimit, aliases: ['NOLIMIT', 'No Limit'] },
  { key: 'odel', name: 'ODEL', src: odel, aliases: ['ODEL'] },
  { key: 'pink-elephant', name: 'PINK ELEPHANT', src: pinkElephant, aliases: ['PINK ELEPHANT', 'Pink Elephant'] },
];

const logosByAlias = new Map<string, BrandLogo>();
BRAND_LOGOS.forEach((logo) => {
  logosByAlias.set(normalize(logo.key), logo);
  logosByAlias.set(normalize(logo.name), logo);
  logo.aliases.forEach((alias) => logosByAlias.set(normalize(alias), logo));
});

export const getBrandLogo = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (!value?.trim()) continue;
    const logo = logosByAlias.get(normalize(value));
    if (logo) return logo;
  }
  return null;
};

export const getBrandLogoSource = (...values: Array<string | null | undefined>) =>
  getBrandLogo(...values)?.src ?? null;

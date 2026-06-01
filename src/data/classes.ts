export type GameClass = {
  name: string
  image: string
  alt: string
  description: string
}

export const gameClasses: GameClass[] = [
  {
    name: 'Berserker',
    image: '/images/Berserker_Portrait.png',
    alt: 'Berserker',
    description:
      'O Berserker é a classe de maior dano físico bruto, tem uma alta quantidade de ataque e HP alto, porém não tanto quanto um Paladino. Quase metade de suas skills são em área, também possui diversas skills para aumentar seu ataque físico.',
  },
  {
    name: 'Paladino',
    image: '/images/paladino.jpg.png',
    alt: 'Paladino',
    description:
      'Paladino é a classe com maior defesa física do jogo, feita para tankar com reduções de dano, bloqueio de escudo e capacidade para aguentar chefes com defesa e HP elevados.',
  },
  {
    name: 'Ranger',
    image: '/images/ranger.png',
    alt: 'Ranger',
    description:
      'O Ranger é um atirador excepcional quando se trata de ataque físico à distância. Não tem muita defesa, mas compensa com evasão alta, invisibilidade e invocação.',
  },
  {
    name: 'Assassino',
    image: '/images/assassino.png',
    alt: 'Assassino',
    description:
      'Assassino é uma evolução de Arqueiro, com ataque físico forte, alta evasão e invisibilidade. É uma ótima classe para ataques rápidos e posicionamento inteligente.',
  },
  {
    name: 'Feiticeiro',
    image: '/images/mage.png',
    alt: 'Feiticeiro',
    description:
      'O Feiticeiro usa fogo, raio e gelo para causar alto dano mágico. Tem poucas defesas, mas muitas habilidades em área e recursos para controlar o adversário.',
  },
  {
    name: 'Necromante',
    image: '/images/necromante.png',
    alt: 'Necromante',
    description:
      'O Necromante é especializado em invocações e ataques sombrios. Suas criaturas ajudam em combate, enquanto debuffs e drenagem de vida enfraquecem o inimigo.',
  },
  {
    name: 'Sábio',
    image: '/images/mistico.png',
    alt: 'Sábio',
    description:
      'Sábios são uma especialização do Sacerdote e podem assumir formas com habilidades diferentes. A classe combina suporte, resistência e flexibilidade.',
  },
  {
    name: 'Clérigo',
    image: '/images/clerigo.png',
    alt: 'Clérigo',
    description:
      'Clérigo tem grande quantidade de curas, remove debuffs e aplica buffs. É excelente para suporte e também consegue resistir bem em combate.',
  },
  {
    name: 'Samurai',
    image: '/images/samurai].png',
    alt: 'Samurai',
    description:
      'O Samurai usa katana para ataques mágicos e físicos a curta distância. Tem boa defesa mágica e dano diferenciado, exigindo cuidado contra classes físicas.',
  },
  {
    name: 'Chronos',
    image: '/images/chronos.png',
    alt: 'Chronos',
    description:
      'Chronos utiliza conjurações e tempo em suas skills, podendo atacar de perto ou de longe. Trabalha bem como suporte para quebrar formações inimigas.',
  },
  {
    name: 'Titã Celeste',
    image: '/images/opitmus.png',
    alt: 'Titã Celeste',
    description:
      'Titã Celeste tem ataques consistentes, penetração alta e evasão elevada. É uma classe de retaguarda que brilha trabalhando com aliados.',
  },
  {
    name: 'Prime',
    image: '/images/prime.png',
    alt: 'Prime',
    description:
      'Prime tem grande quantidade de ataque, penetração e redução de dano nos níveis mais altos, oferecendo presença forte em confrontos prolongados.',
  },
]

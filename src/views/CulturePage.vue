<template>
  <main class="culture-page">
    <div class="culture-inner">
      <h1 class="culture-h1">壶型与纹样寓意</h1>
      <p class="culture-lead">
        本页介绍预览中三种壶型编号与「梅兰竹菊」四君子纹样的传统寓意，与定制预览中的纹理、彩绘一一对应。
      </p>

      <section class="culture-section">
        <h2 class="culture-h2">壶型（1 / 2 / 3）</h2>
        <p class="culture-p">
          当前演示将三款器型暂记为<strong>壶型 1</strong>、<strong>壶型 2</strong>、<strong>壶型 3</strong>，分别对应预览页「模型 1 / 2 / 3」。具体壶名、历史渊源与工艺特点可在确定器型后再行补充。
        </p>
        <ul class="culture-list">
          <li><strong>壶型 1</strong>：对应模型 1。</li>
          <li><strong>壶型 2</strong>：对应模型 2。</li>
          <li><strong>壶型 3</strong>：对应模型 3。</li>
        </ul>
      </section>

      <hr class="culture-hr" />

      <section class="culture-section">
        <h2 class="culture-h2">纹理寓意：梅兰竹菊</h2>
        <p class="culture-p culture-p--muted">
          「四君子」是传统文人画中常见的题材，象征四种品格，亦常用于紫砂装饰纹样。
        </p>

        <div class="culture-grid">
          <article
            v-for="item in motifs"
            :key="item.id"
            class="culture-card"
          >
            <div class="culture-card__media">
              <img :src="item.image" :alt="item.title" class="culture-card__img" />
            </div>
            <h3 class="culture-h3">{{ item.title }}</h3>
            <p class="culture-p">{{ item.meaning }}</p>
          </article>
        </div>
      </section>

      <p class="culture-foot">
        <RouterLink to="/" class="culture-back">返回定制预览</RouterLink>
      </p>
    </div>
  </main>
</template>

<script setup>
const motifs = [
  {
    id: 'mei',
    title: '梅',
    image: 'patterns/A.png',
    meaning:
      '梅开于严寒，报春而不争艳，寓意坚韧不拔、自强不息；在君子之德中常象征守志不移、清贞自守。'
  },
  {
    id: 'lan',
    title: '兰',
    image: 'patterns/B.png',
    meaning:
      '兰生幽谷，香远益清，寓意高洁典雅、内敛含蓄；古人以兰喻君子之德，重其品而不重其艳。'
  },
  {
    id: 'zhu',
    title: '竹',
    image: 'patterns/C.png',
    meaning:
      '竹茎中空，象征虚心；竹节分明，象征气节与操守；风过而叶有声，寓意正直向上、刚柔并济。'
  },
  {
    id: 'ju',
    title: '菊',
    image: 'patterns/D.png',
    meaning:
      '菊耐霜而开，不与百花争春，寓意恬然自适、淡泊明志；亦含晚节弥坚、静守本心之意。'
  }
];
</script>

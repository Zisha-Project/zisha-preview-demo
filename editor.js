// Native Web3D editor mount. This replaces the previous iframe integration so
// the host page owns the canvas, controls and fullscreen lifecycle.
const mount = document.querySelector('#editor-mount');

if (mount) {
  mount.innerHTML = `
    <div id="app" class="editor-app">
      <button id="sidebar-toggle" type="button" aria-label="收起工具面板" aria-expanded="true">&lt;</button>
      <aside id="sidebar">
        <div id="sidebar-header">
          <div id="sidebar-brand">Web3D 工坊</div>
          <div id="sidebar-actions"></div>
        </div>
        <hr>
        <div class="model-btns"><p>选择器型</p>
          <button data-model="models/model1.glb">仿古 · 经典圆润</button>
          <button data-model="models/model2.glb">西施 · 温柔曲线</button>
          <button data-model="models/model3.glb">掇只 · 简洁端庄</button>
          <button data-model="models/model4.glb">水平 · 平稳端正</button>
        </div>
        <hr>
        <div class="color-area"><p>选择泥色</p>
          <button class="color-btn" data-color="#6D5B54">原矿紫泥</button>
          <button class="color-btn" data-color="#B85B46">朱泥</button>
          <button class="color-btn" data-color="#C9B88F">黄金段泥</button>
          <button class="color-btn" data-color="#71806E">本山绿泥</button>
        </div>
        <hr>
        <div class="pattern-area"><p>选择纹样</p>
          <button class="decal-side-btn is-selected" data-decal-type="pattern" data-side="left">左侧纹样</button>
          <button class="decal-side-btn is-selected" data-decal-type="pattern" data-side="right">右侧纹样</button>
          <div class="pattern-item"><button class="pattern-btn" data-pattern="patterns/A.png">梅</button><img src="patterns/A.png" alt="梅纹样" class="pattern-preview"></div>
          <div class="pattern-item"><button class="pattern-btn" data-pattern="patterns/B.png">兰</button><img src="patterns/B.png" alt="兰纹样" class="pattern-preview"></div>
          <div class="pattern-item"><button class="pattern-btn" data-pattern="patterns/C.png">竹</button><img src="patterns/C.png" alt="竹纹样" class="pattern-preview"></div>
          <div class="pattern-item"><button class="pattern-btn" data-pattern="patterns/D.png">菊</button><img src="patterns/D.png" alt="菊纹样" class="pattern-preview"></div>
        </div>
        <hr>
        <div class="capacity-area"><p>容量（100—500cc）</p><input type="number" id="capacity-input" min="100" max="500" step="10" value="300"><div id="capacity-display">当前容量：300 cc</div></div>
        <button id="clear-decal-btn">清除所有贴图</button>
      </aside>
      <div id="viewer"></div>
    </div>`;

  import('./main.js').then(() => {
    window.zishaEditor = {
      setModel: (url) => window.dispatchEvent(new CustomEvent('zisha:model', { detail: { url } })),
      setColor: (color) => window.dispatchEvent(new CustomEvent('zisha:color', { detail: { color } })),
      setCapacity: (value) => window.dispatchEvent(new CustomEvent('zisha:capacity', { detail: { value } })),
      setPattern: (url) => window.dispatchEvent(new CustomEvent('zisha:pattern', { detail: { url } })),
    };
    window.dispatchEvent(new Event('zisha:ready'));
  });

}

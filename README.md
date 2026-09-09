# 云琢紫砂 · 数字工坊

一个前后端分离的紫砂数字体验原型：主页负责 Web3D 模拟与数字博物馆两大模块，Web3D 工坊使用 Three.js 加载 GLB 器型并实时切换泥色与纹样。

## 启动

在本目录运行：

```bash
python3 server.py
```

服务监听 `0.0.0.0:8000`，浏览器访问 <http://127.0.0.1:8000/index.html>。

## 页面

- `index.html`：品牌主页与三模块入口
- `museum.html`：紫砂数字博物馆
- `simulator.html`：全屏 Web3D 工作区（器型、泥色、纹样与容量调整）
- `editor.js`：原生 Web3D 编辑器挂载逻辑

## API

Web3D 编辑器支持器型、泥色、纹样与容量调整。

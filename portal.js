const menuToggle=document.querySelector('#menu-toggle');
const siteNav=document.querySelector('#site-nav');
menuToggle?.addEventListener('click',()=>{const open=siteNav.classList.toggle('is-open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'关闭导航':'打开导航')});
siteNav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{siteNav.classList.remove('is-open');menuToggle?.setAttribute('aria-expanded','false')}));
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

// biome-ignore format: Playwright CLI expects a function expression without a trailing semicolon.
async (sessionPage) => {
  const origin = new URL(sessionPage.url()).origin;
  const page = await sessionPage.context().newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const cta = () => page.locator('a[data-venom-ready]');
  const ready = () => page.waitForFunction(() => document.querySelector('a[data-venom-ready="true"]'));
  const restored = () => page.waitForFunction(() => !document.documentElement.hasAttribute('data-storylio-venom-cursor'));
  const results = [];
  const atProjects = async p => {
    await p.waitForURL(url=>url.hash==='#selected-projects');
    await p.waitForFunction(()=>Math.abs(document.getElementById('selected-projects').getBoundingClientRect().top)<2);
  };
  const navigateAway = async p => {
    await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await p.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Projects',exact:true}).click();
    await p.waitForURL(url=>url.pathname==='/projects');
    await p.waitForFunction(()=>!document.querySelector('[data-venom-canvas]'));
  };
  try {
    await page.addInitScript(()=>{
      window.__venomIconReads=0;
      const getImageData=CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData=function(...args){
        if(this.canvas.width===96&&this.canvas.height===96)window.__venomIconReads++;
        return getImageData.apply(this,args);
      };
      const names=new WeakMap();
      const getUniformLocation=WebGL2RenderingContext.prototype.getUniformLocation;
      WebGL2RenderingContext.prototype.getUniformLocation=function(program,name){
        const location=getUniformLocation.call(this,program,name);
        if(location)names.set(location,name);
        return location;
      };
      const uniform1f=WebGL2RenderingContext.prototype.uniform1f;
      WebGL2RenderingContext.prototype.uniform1f=function(location,value){
        if(this.canvas.dataset.venomCanvas&&names.get(location)==='uLabelAmt'&&window.__venomFirstLabel===undefined)window.__venomFirstLabel=value;
        return uniform1f.call(this,location,value);
      };
    });
    const widthCoverage=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
      const canvas=document.querySelector('[data-venom-canvas]');
      const rect=document.querySelector('[data-venom-link]').getBoundingClientRect();
      const area=canvas.getBoundingClientRect();
      const gl=canvas.getContext('webgl2');
      const scale=canvas.width/area.width;
      const x=Math.round((rect.left-area.left)*scale);
      const width=Math.floor(rect.width*scale);
      const y=Math.floor(canvas.height-(rect.top+rect.height/2-area.top)*canvas.height/area.height);
      const row=new Uint8Array(width*4);
      gl.readPixels(x,y,width,1,gl.RGBA,gl.UNSIGNED_BYTE,row);
      let opaque=0;
      for(let i=3;i<row.length;i+=4)if(row[i]>240)opaque++;
      resolve(opaque/width);
    })));
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(origin);
    await ready();
    const layers = await page.evaluate(() => {
      const canvas = document.querySelector("[data-venom-canvas]");
      const chrome = document.querySelector("[data-public-chrome]");
      const nav = document.querySelector('nav[aria-label="Main navigation"]');
      return {
        sameContext:
          canvas.parentElement === chrome &&
          nav.closest("[data-public-chrome]") === chrome,
        canvas: Number(getComputedStyle(canvas).zIndex),
        nav: Number(getComputedStyle(nav.parentElement).zIndex),
      };
    });
    assert(
      layers.sameContext && layers.nav > layers.canvas,
      "Venom canvas escapes the navbar stacking context: " +
        JSON.stringify(layers),
    );
    assert(await widthCoverage()>.85,'CTA starts with a growth intro');
    assert(await page.evaluate(()=>window.__venomFirstLabel)===1,'First rendered label is delayed');
    assert(await page.evaluate(()=>window.__venomIconReads)===2,'Cursor asset preparation did not run once per icon');
    results.push({mode:'startup',fullSize:true,labelVisibleOnFirstFrame:true});
    const dimensions = await cta().evaluate(el => {
      const style = getComputedStyle(el), rect = el.getBoundingClientRect();
      return {font:style.fontFamily,fontSize:style.fontSize,weight:style.fontWeight,height:rect.height,href:el.getAttribute('href')};
    });
    assert(dimensions.font.toLowerCase().includes('satoshi'),'CTA did not load Satoshi');
    assert(dimensions.fontSize==='14px'&&dimensions.weight==='500'&&dimensions.height>=44,'CTA violates typography/target rules');
    const rect=await cta().boundingBox();
    await page.mouse.move(rect.x+rect.width+45,rect.y+55,{steps:15});
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-storylio-venom-cursor'));
    await page.waitForTimeout(1300);
    const pixels = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(()=>{
      const canvas=document.querySelector('[data-venom-canvas]');
      const gl=canvas.getContext('webgl2');
      const pixels=new Uint8Array(canvas.width*canvas.height*4);
      gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let clear=0,opaque=0,hash=0;
      for(let i=0;i<pixels.length;i+=4){
        if(pixels[i+3]===0)clear++;
        if(pixels[i+3]>240)opaque++;
        hash=(hash+pixels[i]*(i+1)+pixels[i+3])%2147483647;
      }
      resolve({clear,opaque,hash,total:pixels.length/4,webglError:gl.getError()});
    })));
    const before=await pixels();
    await page.waitForTimeout(500);
    const after=await pixels();
    assert(before.clear>before.total*.5&&before.opaque>300,'Canvas has no transparent scene/material');
    assert(before.hash!==after.hash,'Rendered scene freezes with a stationary mouse');
    assert(!before.webglError&&!after.webglError,'WebGL error');
    await page.screenshot({path:'.playwright-cli/venom-home-pull.png'});
    await page.mouse.move(30,30);
    await restored();
    results.push({mode:'webgl',dimensions,transparent:true,motion:true});

    await page.evaluate(()=>window.__venomNavigationMarker=true);
    await cta().click();
    await atProjects(page);
    assert(await page.locator('[data-venom-canvas]').count()===1,'Anchor recreated or removed the scene');
    await navigateAway(page);
    await page.waitForFunction(()=>!document.querySelector('[data-venom-canvas]'));
    await restored();
    assert(await page.evaluate(()=>window.__venomNavigationMarker===true),'Animated CTA reloaded document');
    await page.goBack();
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await ready();
    assert(await page.locator('[data-venom-canvas]').count()===1,'Duplicate canvas after back navigation');
    assert(await page.evaluate(()=>window.__venomIconReads)===2,'Back navigation recomputed cursor distance fields');
    results.push({mode:'animated-navigation',cleanup:true,back:true,cursorAssetsCached:true});

    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>!document.querySelector('[data-venom-canvas]'));
    await restored();
    const target=page.locator('[data-venom-link]');
    await target.focus();
    await page.keyboard.press('ArrowRight');
    assert(await target.evaluate(el=>getComputedStyle(el).outlineStyle)!=='none','Focus ring missing');
    assert(await target.evaluate(el=>getComputedStyle(el).color)!=='rgba(0, 0, 0, 0)','Fallback label invisible');
    assert(await target.evaluate(el=>getComputedStyle(el,'::after').animationName)==='none','Reduced motion keeps the orbit moving');
    await page.evaluate(()=>window.__venomNavigationMarker=true);
    await page.keyboard.press('Enter');
    await atProjects(page);
    assert(await page.evaluate(()=>window.__venomNavigationMarker===true),'CTA caused full document reload');
    await restored();
    assert(await page.locator('[data-venom-canvas]').count()===0,'Canvas leaked after navigation');
    results.push({mode:'reduced-motion',keyboardNavigation:true,cleanup:true});

    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(origin);
    await ready();
    await page.waitForTimeout(1800);
    const sceneCanvas = await page.locator('[data-venom-canvas]').elementHandle();
    const fullSize = async () => {
      await ready();
      await page.waitForFunction(()=>document.querySelector('[data-venom-canvas]')?.dataset.venomState==='running');
      const size = await widthCoverage();
      assert(size > .85, `CTA replayed its growth intro on resume: ${size}`);
      assert(await sceneCanvas.evaluate(el => el === document.querySelector('[data-venom-canvas]')), 'Resume recreated the scene');
    };
    const paused = () => page.waitForFunction(() => {
      const canvas = document.querySelector('[data-venom-canvas]');
      return canvas && canvas.style.opacity === '0' && !document.querySelector('[data-venom-ready]');
    });
    const pausedVisible = () => page.waitForFunction(() => {
      const canvas=document.querySelector('[data-venom-canvas]');
      return canvas?.dataset.venomState==='paused-visible'&&document.querySelector('[data-venom-still]')&&document.querySelector('[data-venom-ready="true"]');
    });
    await page.evaluate(()=>window.scrollTo({top:innerHeight*2,behavior:'instant'}));
    await paused();
    await restored();
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await fullSize();
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await pausedVisible();
    await restored();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await fullSize();
    // Deterministic document visibility event, confined to this disposable page.
    try {
      await page.evaluate(()=>{
        Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await pausedVisible();
      await restored();
    } finally {
      await page.evaluate(()=>{
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await fullSize();
    assert(await page.locator('[data-venom-canvas]').count()===1,'Duplicate canvas after resume');
    results.push({mode:'scroll/focus/visibility-resume',sameCanvas:true,fullSize:true});
    await page.evaluate(()=>document.querySelector('[data-venom-canvas]').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(()=>!document.querySelector('[data-venom-ready]'));
    await restored();
    assert(await page.locator('[data-venom-link]').evaluate(el=>getComputedStyle(el).color)!=='rgba(0, 0, 0, 0)','Context loss hides the link');
    results.push({mode:'offscreen/context-loss',fallback:true});

    const pending=await page.context().newPage();
    pending.on('pageerror',error=>errors.push(error.message));
    try {
      await pending.addInitScript(()=>{
        const getExtension=WebGL2RenderingContext.prototype.getExtension;
        WebGL2RenderingContext.prototype.getExtension=function(name){
          if(this.canvas.dataset.venomCanvas&&name==='KHR_parallel_shader_compile')return {COMPLETION_STATUS_KHR:0x91b1};
          return getExtension.call(this,name);
        };
        const getProgramParameter=WebGL2RenderingContext.prototype.getProgramParameter;
        WebGL2RenderingContext.prototype.getProgramParameter=function(program,parameter){
          if(this.canvas.dataset.venomCanvas&&parameter===0x91b1)return Boolean(window.__releaseVenomShaders);
          return getProgramParameter.call(this,program,parameter);
        };
      });
      await pending.goto(origin);
      await pending.locator('[data-venom-canvas]').waitFor({state:'attached'});
      const button=pending.locator('[data-venom-link]');
      const before=await button.boundingBox();
      const orbit=()=>button.evaluate(el=>{
        const style=getComputedStyle(el,'::after');
        return {angle:style.getPropertyValue('--venom-orbit-angle'),opacity:Number(style.opacity),state:style.animationPlayState};
      });
      const initial=await orbit();
      await pending.waitForTimeout(250);
      assert(initial.angle!==(await orbit()).angle,'Fallback rim does not orbit');
      assert(await button.evaluate(el=>getComputedStyle(el).color)!=='rgba(0, 0, 0, 0)','Label hidden while shaders compile');
      await button.focus();
      assert(await button.evaluate(el=>getComputedStyle(el).outlineStyle)!=='none','Loading link has no focus ring');
      await pending.screenshot({path:'.playwright-cli/venom-startup-fallback.png'});
      await button.click();
      await atProjects(pending);
      await navigateAway(pending);
      assert(await pending.locator('[data-venom-canvas]').count()===0,'Navigation during shader compilation leaked the canvas');
      await pending.goBack();
      await pending.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      await pending.locator('[data-venom-canvas]').waitFor({state:'attached'});
      await pending.evaluate(()=>window.__releaseVenomShaders=true);
      await pending.waitForFunction(()=>document.querySelector('[data-venom-ready="true"]'));
      await pending.waitForFunction(()=>getComputedStyle(document.querySelector('[data-venom-link]'),'::after').opacity==='0');
      const after=await button.boundingBox();
      assert(before.width===after.width&&before.height===after.height,'WebGL handover shifts button dimensions');
      assert((await orbit()).state==='paused','Orbit keeps running underneath WebGL');
      await pending.screenshot({path:'.playwright-cli/venom-startup-ready.png'});
      await button.click();
      await atProjects(pending);
      await navigateAway(pending);
      assert(await pending.locator('[data-venom-canvas]').count()===0,'Startup canvas leaked after navigation');
    } finally {await pending.close();}
    results.push({mode:'pending-shader',readableFallback:true,orbit:true,smoothHandover:true,navigationWhilePreparing:true});

    const noParallel=await page.context().newPage();
    noParallel.on('pageerror',error=>errors.push(error.message));
    try {
      await noParallel.addInitScript(()=>{
        const original=WebGL2RenderingContext.prototype.getExtension;
        WebGL2RenderingContext.prototype.getExtension=function(name){
          if(this.canvas.dataset.venomCanvas&&name==='KHR_parallel_shader_compile')return null;
          return original.call(this,name);
        };
      });
      await noParallel.goto(origin);
      await noParallel.waitForFunction(()=>document.querySelector('[data-venom-ready="true"]'));
    } finally {await noParallel.close();}
    results.push({mode:'no-parallel-compile',webgl:true});

    const invalidShader=await page.context().newPage();
    invalidShader.on('pageerror',error=>errors.push(error.message));
    try {
      await invalidShader.addInitScript(()=>{
        window.__venomDeletedPrograms=0;
        const shaderSource=WebGL2RenderingContext.prototype.shaderSource;
        WebGL2RenderingContext.prototype.shaderSource=function(shader,source){
          return shaderSource.call(this,shader,this.canvas.dataset.venomCanvas?`invalid_shader\n${source}`:source);
        };
        const deleteProgram=WebGL2RenderingContext.prototype.deleteProgram;
        WebGL2RenderingContext.prototype.deleteProgram=function(program){
          if(this.canvas.dataset.venomCanvas)window.__venomDeletedPrograms++;
          return deleteProgram.call(this,program);
        };
      });
      await invalidShader.goto(origin);
      await invalidShader.waitForFunction(()=>window.__venomDeletedPrograms>=3);
      assert(await invalidShader.locator('[data-venom-ready]').count()===0,'Failed shader hid the fallback');
      const button=invalidShader.locator('[data-venom-link]');
      assert(await button.evaluate(el=>getComputedStyle(el).color)!=='rgba(0, 0, 0, 0)','Failed shader hides label');
      await button.click();
      await atProjects(invalidShader);
      await navigateAway(invalidShader);
      assert(await invalidShader.locator('[data-venom-canvas]').count()===0,'Failed shader scene leaked after navigation');
    } finally {await invalidShader.close();}
    results.push({mode:'invalid-shader',readableFallback:true,programsDisposed:true,navigation:true});

    // Keep the no-WebGL override isolated so repeated CLI runs remain valid.
    const noGl=await page.context().newPage();
    try {
      await noGl.addInitScript(()=>{
        const original=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(type,...args){
          if(type==='webgl2')return null;
          return original.call(this,type,...args);
        };
      });
      await noGl.goto(origin);
      const button=noGl.locator('[data-venom-link]');
      await button.waitFor();
      await noGl.waitForTimeout(800);
      assert(await noGl.locator('[data-venom-ready]').count()===0,'No-WebGL fallback failed');
      await button.click();
      await atProjects(noGl);
    } finally {await noGl.close();}
    results.push({mode:'no-webgl',navigation:true});

    const touchContext=await page.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    try {
      const touch=await touchContext.newPage();
      await touch.goto(origin);
      const button=touch.locator('[data-venom-link]');
      await button.waitFor();
      assert(await touch.locator('[data-venom-canvas]').count()===0,'Touch loaded animated canvas');
      assert(await button.evaluate(el=>getComputedStyle(el).touchAction)==='manipulation','Touch scrolling blocked');
      await touch.waitForFunction(()=>{
        let el=document.querySelector('[data-venom-link]');
        if(!el)return false;
        for(;el;el=el.parentElement)if(Number(getComputedStyle(el).opacity)<.99)return false;
        return true;
      });
      assert(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
      await touch.screenshot({path:'.playwright-cli/venom-home-mobile.png'});
      await button.tap();
      await atProjects(touch);
    } finally {await touchContext.close();}
    results.push({mode:'touch',navigation:true});
    assert(errors.length===0,`Runtime errors: ${errors.join('; ')}`);
    return {results,errors};
  } finally {await page.close();}
}

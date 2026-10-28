// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const page=await sessionPage.context().newPage(),origin=new URL(sessionPage.url()).origin;
  try {
    await page.setViewportSize({width:390,height:844});await page.goto(origin+'/boundary-fixture-check');
    await page.getByRole('button',{name:'Trigger fixture error',exact:true}).click();
    await page.getByRole('heading',{name:'This page couldn’t load.',exact:true}).waitFor();
    const boundary=page.locator('[data-error-boundary="public"]');
    if((await boundary.innerText()).includes('Private fixture'))throw Error('Internal details leaked');
    await page.getByRole('button',{name:'Try again',exact:true}).click();
    await page.getByRole('button',{name:'Trigger fixture error',exact:true}).waitFor();
    return {publicBoundary:true,noDetailsLeaked:true,retryRecovered:true};
  }finally{await page.close()}
}

const fetch = require('node-fetch');

// 测试获取商品列表的API，然后选择第一个商品进行测试
async function testProductAPI() {
  try {
    // 首先获取商品列表
    const listResponse = await fetch('http://localhost:3010/api/products');
    const listData = await listResponse.json();
    
    console.log('Product List Response:', JSON.stringify(listData, null, 2));
    
    if (listData.success && listData.data && listData.data.length > 0) {
      // 选择第一个商品
      const firstProduct = listData.data[0];
      console.log('\nFirst Product:', JSON.stringify(firstProduct, null, 2));
      
      if (firstProduct) {
        console.log('\nSeller Info:', JSON.stringify(firstProduct.seller, null, 2));
        if (firstProduct.seller) {
          console.log('\nIs Banned:', firstProduct.seller.isBanned);
          console.log('Is Banned Type:', typeof firstProduct.seller.isBanned);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProductAPI();

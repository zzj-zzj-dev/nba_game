// PocketBase 启动时自动配置

onServerAfterStart(() => {
  try {
    const collections = $app.dao().findCollectionsByType('base');
    
    // 1. 确保 users 集合的创建规则允许注册
    const usersCol = $app.dao().findCollectionByNameOrId('users');
    if (usersCol) {
      // 允许匿名用户注册
      usersCol.createRule = '';
      $app.dao().saveRecord(usersCol);
      console.log('✅ Users collection: create rule enabled');
    }
    
    // 2. 创建 saves 集合
    const hasSaves = collections.some(c => c.name === 'saves');
    
    if (!hasSaves) {
      const collection = new RecordModel();
      
      collection.set('name', 'saves');
      collection.set('type', 'base');
      collection.set('system', false);
      collection.set('schema', [
        {
          name: 'user',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: '_pb_users_auth_'
        },
        {
          name: 'gameData',
          type: 'json',
          required: true
        }
      ]);
      
      collection.set('indexes', [
        'CREATE UNIQUE INDEX idx_saves_user ON saves (user)'
      ]);
      
      collection.set('listRule', '@request.auth.id = user');
      collection.set('viewRule', '@request.auth.id = user');
      collection.set('createRule', '@request.auth.id != ""');
      collection.set('updateRule', '@request.auth.id = user');
      collection.set('deleteRule', '@request.auth.id = user');
      
      $app.dao().saveRecord(collection);
      console.log('✅ Saves collection created');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
});

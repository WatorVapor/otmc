// DidResolverLocalStore.test.js

const { DidResolverLocalStore } = require('../otmc.did.resolver.local.js');  // 假设 DidResolverLocalStore 是从这个文件中导出的
const { DidStoreDocument, DidStoreManifest } = require('../otmc.did.store.document.js');
const { StoreKey } = require('../otmc.const.js');

jest.mock('../otmc.did.store.document.js');  // Mock 模块

describe('DidResolverLocalStore', () => {
  let localStore, mockWrapper;

  beforeEach(() => {
    // 初始化 mockWrapper 参数
    mockWrapper = {
      auth: 'mockAuth',
      otmc: 'mockOtmc',
      base32: 'mockBase32',
      util: 'mockUtil'
    };

    // 创建 DidResolverLocalStore 实例
    localStore = new DidResolverLocalStore(mockWrapper);

    // 设置 mock 实例方法
    DidStoreDocument.mockImplementation(() => ({
      put: jest.fn((key, value, options, callback) => {
        callback(null); // 模拟成功的写入操作
      })
    }));
    DidStoreManifest.mockImplementation(() => ({
      put: jest.fn((key, value, options, callback) => {
        callback(null); // 模拟成功的写入操作
      })
    }));
  });

  test('should store DID document correctly', async () => {
    const storeKey = StoreKey.open.did.document;
    const didDocStr = '{"id": "did:example:123"}';

    // 调用 storeDid 方法
    await localStore.storeDid(storeKey, didDocStr);

    // 验证 DidStoreDocument.put 是否被调用
    expect(localStore.didDocLS.put).toHaveBeenCalledWith(
      storeKey,
      didDocStr,
      { keyEncoding: 'utf8', valueEncoding: 'utf8' },
      expect.any(Function)
    );
  });

  test('should store manifest correctly', async () => {
    const storeKey = StoreKey.open.did.manifest;
    const manifestStr = '{"id": "manifest:example:123"}';

    // 调用 storeManifest 方法
    await localStore.storeManifest(storeKey, manifestStr);

    // 验证 DidStoreManifest.put 是否被调用
    expect(localStore.manifestLS.put).toHaveBeenCalledWith(
      storeKey,
      manifestStr,
      { keyEncoding: 'utf8', valueEncoding: 'utf8' },
      expect.any(Function)
    );
  });

  test('should log error when storeDid encounters an error', async () => {
    const storeKey = StoreKey.open.did.document;
    const didDocStr = '{"id": "did:example:123"}';

    // 模拟 put 方法调用失败
    localStore.didDocLS.put.mockImplementationOnce((key, value, options, callback) => {
      callback(new Error('Storage failed'));
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // 调用 storeDid 方法
    await localStore.storeDid(storeKey, didDocStr);

    // 验证是否捕获到错误日志
    expect(consoleSpy).toHaveBeenCalledWith(
      'DidResolverLocalStore::storeDid::err=:<', 
      new Error('Storage failed'), 
      '>'
    );

    consoleSpy.mockRestore();  // 恢复 console.log
  });
});

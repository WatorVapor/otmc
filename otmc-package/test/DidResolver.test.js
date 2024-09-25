import { DidResolver } from '../otmc.did.resolver.js'; // 更新为实际路径
import EventEmitter from 'events';

describe('DidResolver', () => {
  let resolver;
  let mockEEInternal;

  beforeEach(() => {
    mockEEInternal = new EventEmitter();
    resolver = new DidResolver(mockEEInternal);
    resolver.localStore = { storeDid: jest.fn(), storeManifest: jest.fn() };
    resolver.webStore = { storeDid: jest.fn(), storeManifest: jest.fn(), resolver: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks(); // 清除所有 mock
  });

  test('should listen for sys.authKey.ready event', () => {
    const mockEvent = {
      auth: {},
      otmc: {},
      base32: {},
      util: {}
    };
    mockEEInternal.emit('sys.authKey.ready', mockEvent);

    expect(resolver.auth).toEqual(mockEvent.auth);
    expect(resolver.otmc).toEqual(mockEvent.otmc);
    expect(resolver.base32).toEqual(mockEvent.base32);
    expect(resolver.util).toEqual(mockEvent.util);
  });

  test('should resolve DID address', async () => {
    const didAddress = 'did:example:123';
    const mockDidDoc = { id: didAddress };

    resolver.webStore.resolver.mockResolvedValue(mockDidDoc);
    
    const result = await resolver.resolver(didAddress);
    
    expect(resolver.webStore.resolver).toHaveBeenCalledWith(didAddress);
    expect(result).toEqual(mockDidDoc);
  });

  test('should store DID document', async () => {
    const storeKey = 'someKey';
    const documentObj = { id: 'did:example:123' };

    await resolver.storeDid(storeKey, documentObj);

    expect(resolver.localStore.storeDid).toHaveBeenCalledWith(storeKey, JSON.stringify(documentObj));
    expect(resolver.webStore.storeDid).toHaveBeenCalledWith(documentObj);
  });

  test('should store manifest', async () => {
    const storeKey = 'manifestKey';
    const manifestObj = { id: 'manifest:example:123' };

    await resolver.storeManifest(storeKey, manifestObj);

    expect(resolver.localStore.storeManifest).toHaveBeenCalledWith(storeKey, JSON.stringify(manifestObj));
    expect(resolver.webStore.storeManifest).toHaveBeenCalledWith(manifestObj);
  });
});

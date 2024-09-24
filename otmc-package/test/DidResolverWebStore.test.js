import { DidResolverWebStore } from './path/to/your/DidResolver'; // 更新为实际路径

describe('DidResolverWebStore', () => {
  let webStore;
  const mockWrapper = {
    auth: { sign: jest.fn().mockReturnValue({ token: 'mockToken' }) },
    otmc: {},
    base32: {},
    util: {
      encodeBase64Str: jest.fn().mockReturnValue('mockEncodedToken')
    }
  };

  beforeEach(() => {
    webStore = new DidResolverWebStore(mockWrapper);
    global.fetch = jest.fn(); // Mock fetch
  });

  afterEach(() => {
    jest.clearAllMocks(); // 清除所有 mock
  });

  test('should generate access token correctly', () => {
    const token = webStore.accessToken_();
    expect(mockWrapper.auth.sign).toHaveBeenCalledWith({});
    expect(token).toBe('mockEncodedToken');
  });

  test('should request API correctly', async () => {
    const mockResponse = { data: 'mockData' };
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const didAddress = 'did:example:123';
    const result = await webStore.requestAPI_(`document/${didAddress}`);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.any(Request));
    expect(result).toEqual(mockResponse);
  });

  test('should post API correctly', async () => {
    const mockResponse = { success: true };
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const apiPath = 'document/upload/123';
    const result = await webStore.postAPI_(apiPath);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.any(Request));
    expect(result).toEqual(mockResponse);
  });

  test('should handle fetch errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(webStore.requestAPI_('document/invalid')).rejects.toThrow('Network error');
  });
});

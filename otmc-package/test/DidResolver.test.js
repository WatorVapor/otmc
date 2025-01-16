import { DidResolver } from '../otmc.did.resolver.js'; // 更新为实际路径
import EventEmitter from 'events';

import { test,describe,beforeEach,afterEach } from 'node:test';


describe('DidResolver', () => {
  let resolver;
  let mockEEInternal;

  beforeEach(() => {
    mockEEInternal = new EventEmitter();
    resolver = new DidResolver(mockEEInternal);
  });

  afterEach(() => {
  });
});

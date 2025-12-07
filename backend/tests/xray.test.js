import { jest } from '@jest/globals';
import {
  buildBaseConfig,
  buildVMessInbound,
  buildRouting,
  generateFullConfig
} from '../src/services/xray/configBuilder.js';
import { configSchema } from '../src/validators/xrayValidator.js';

const mockPost = jest.fn().mockResolvedValue({ data: { ok: true } });

jest.unstable_mockModule('axios', () => ({
  default: {
    create: () => ({ post: mockPost })
  }
}));

const xrayStatsService = await import('../src/services/xray/xrayStatsService.js');

describe('Xray config builder', () => {
  it('generates full config with inbounds/outbounds', () => {
    const base = buildBaseConfig();
    const inbound = buildVMessInbound(10086, {
      clients: [{ id: 'uuid', email: 'test@example.com' }],
      streamSettings: { network: 'tcp', security: 'none' }
    });
    const routing = buildRouting([]);
    const config = generateFullConfig([inbound], routing, base);
    expect(config.inbounds.length).toBe(1);
    expect(config.outbounds.length).toBeGreaterThan(0);
  });

  it('validates config schema and fails without inbounds', () => {
    const { error } = configSchema.validate({
      log: {},
      api: {},
      outbounds: []
    });
    expect(error).toBeTruthy();
  });
});

describe('Xray stats service', () => {
  it('calls axios for user stats', async () => {
    await xrayStatsService.getUserStats('user@example.com');
    expect(mockPost).toHaveBeenCalled();
  });
});

import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const { buildBrandRecommendationResult } = await server.ssrLoadModule('/src/lib/size-recommendation.ts');

const customer = {
  gender: 'women', preferredClothing: 'dress', unit: 'cm',
  measurements: { bust: 90 }, primaryMeasurementKeys: ['bust'],
};
const row = (id, sizeLabel, overrides = {}) => ({
  id, sizeLabel, sizeLabels: sizeLabel, sizeChartId: 'chart-a', sellerUid: 'seller-a',
  brandName: 'Test Brand', gender: 'Women', clothingType: 'dress', unit: 'cm',
  measurements: { bust: 90 }, primaryMeasurementKeys: ['bust'], isActive: true,
  ...overrides,
});

test('customers see the full size system in the recommendation and explanation', () => {
  for (const system of ['UK', 'US', 'EU', 'CUSTOM']) {
    const { recommendations } = buildBrandRecommendationResult({ customer, brandRows: [row('size-1', `${system} 10`)] });
    assert.equal(recommendations[0].recommendedSize, `${system} 10`);
    assert.equal(recommendations[0].sizeLabel, `${system} 10`);
    assert.match(recommendations[0].explanation, new RegExp(`${system} 10`));
  }
});

test('available sizes include the whole active chart and keep equal values in different systems distinct', () => {
  const { recommendations } = buildBrandRecommendationResult({ customer, brandRows: [
    row('size-1', 'UK 10'),
    row('size-2', 'US 10', { measurements: { bust: 120 } }),
    row('size-3', 'EU 38'),
    row('size-4', 'UK 12', { isActive: false }),
    row('size-5', 'UK 14', { sizeChartId: 'chart-b', measurements: { bust: 140 } }),
    row('size-6', 'UK 10'),
  ] });
  assert.deepEqual(recommendations[0].availableSizes, ['UK 10', 'US 10', 'EU 38']);
});

test('sizing-system labels do not change measurement-based matching', () => {
  const plain = buildBrandRecommendationResult({ customer, brandRows: [row('size-1', '10')] });
  const labeled = buildBrandRecommendationResult({ customer, brandRows: [row('size-1', 'UK 10')] });
  assert.equal(labeled.recommendations[0].matchScore, plain.recommendations[0].matchScore);
  assert.equal(labeled.recommendations[0].confidence, plain.recommendations[0].confidence);
});

test('existing letter sizes and catalog records without a chart ID remain readable', () => {
  const { recommendations } = buildBrandRecommendationResult({ customer, brandRows: [row('legacy', 'M', { sizeChartId: null })] });
  assert.equal(recommendations[0].recommendedSize, 'M');
  assert.deepEqual(recommendations[0].availableSizes, ['M']);
});

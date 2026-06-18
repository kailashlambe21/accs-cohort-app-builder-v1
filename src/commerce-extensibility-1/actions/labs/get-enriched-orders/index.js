const { Core } = require('@adobe/aio-sdk');
const libDb = require('@adobe/aio-lib-db');

const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const DEFAULT_SCOPES = 'openid AdobeID email profile adobeio_api adobeio.abdata.read adobeio.abdata.manage adobeio.abdata.write';

function resolveImsScopeParam (raw, defaultScopes) {
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) {
    return defaultScopes;
  }
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean).join(' ');
  }
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t).trim()).filter(Boolean).join(' ');
      }
    } catch {
      /* fall through */
    }
  }
  return s.split(/[,\s]+/).filter(Boolean).join(' ');
}

async function getImsAccessToken (params) {
  const body = new URLSearchParams({
    client_id: params.IMS_OAUTH_S2S_CLIENT_ID,
    client_secret: params.IMS_OAUTH_S2S_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: resolveImsScopeParam(params.IMS_OAUTH_S2S_SCOPES, DEFAULT_SCOPES),
  });
  const res = await fetch(IMS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IMS token request failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function main (params) {
  const logger = Core.Logger('get-enriched-orders', {
    level: params.LOG_LEVEL || 'info',
  });

  try {
    const dbToken = await getImsAccessToken(params);
    const dbBase = await libDb.init({ token: dbToken, region: params.AIO_DB_REGION });
    const db = await dbBase.connect();
    const ordersCollection = db.collection('enriched_orders');

    let orders;
    if (params.orderIds) {
      const ids = params.orderIds.split(',').map((id) => id.trim());
      orders = await ordersCollection.find({ _id: { $in: ids } }).toArray();
    } else {
      orders = await ordersCollection.find({}).toArray();
    }

    orders.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce(
        (sum, o) => sum + parseFloat(o.grandTotal || 0),
        0
      ),
      tierBreakdown: orders.reduce((acc, o) => {
        const tier = o.enrichment?.orderTier || 'unknown';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {}),
      highValueCount: orders.filter((o) => o.enrichment?.isHighValue).length,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { orders, summary },
    };
  } catch (error) {
    logger.error(`Failed to fetch enriched orders: ${error?.message || String(error)}`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch enriched orders' },
    };
  }
}

exports.main = main;

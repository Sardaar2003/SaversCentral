import axios from 'axios';

class SublyticsService {
  async submitOrder(payload) {
    const sublyticsUrl = process.env.SUBLYTICS_URL || 'https://redeo.sublytics.com/api/order/doAddProcess';
    
    console.log(`[DEBUG][SUBLYTICS] ──── API CALL START ────`);
    console.log(`[DEBUG][SUBLYTICS] Target URL: ${sublyticsUrl}`);

    // Build request payload matching Sublytics API requirements
    const requestData = {
      user_id: process.env.SUBLYTICS_USER_ID || '102',
      user_password: process.env.SUBLYTICS_PASSWORD || '274jvD#dfw',
      connection_id: String(payload.connectionId),
      campaign_id: String(payload.campaignId),
      payment_method_id: String(payload.payment_method_id || 1), // 1 - Credit Card
      offers: [
        {
          offer_id: Number(payload.offerId),
          order_offer_quantity: 1
        }
      ],
      email: payload.email,
      phone: payload.phone,
      bill_fname: payload.bill_fname,
      bill_lname: payload.bill_lname,
      bill_country: payload.bill_country || 'US',
      bill_address1: payload.bill_address1,
      bill_address2: payload.bill_address2 || '',
      bill_city: payload.bill_city,
      bill_state: payload.bill_state,
      bill_zipcode: payload.bill_zipcode,
      shipping_same: payload.shipping_same === 'true' || payload.shipping_same === true,
      
      // If shipping is not same, pass shipping fields
      ship_fname: payload.shipping_same ? '' : payload.ship_fname,
      ship_lname: payload.shipping_same ? '' : payload.ship_lname,
      ship_country: payload.shipping_same ? '' : (payload.ship_country || 'US'),
      ship_address1: payload.shipping_same ? '' : payload.ship_address1,
      ship_address2: payload.shipping_same ? '' : (payload.ship_address2 || ''),
      ship_city: payload.shipping_same ? '' : payload.ship_city,
      ship_state: payload.shipping_same ? '' : payload.ship_state,
      ship_zipcode: payload.shipping_same ? '' : payload.ship_zipcode,

      card_type_id: String(payload.card_type_id || 2), // 2 - Visa
      card_number: String(payload.card_number),
      card_cvv: String(payload.card_cvv),
      card_exp_month: String(payload.card_exp_month),
      card_exp_year: String(payload.card_exp_year),

      ip_address: payload.ip_address || '127.0.0.1',
      user_agent: payload.user_agent || 'Mozilla/5.0'
    };

    // Log the payload with sensitive fields masked
    const safeLog = { ...requestData };
    safeLog.user_password = '****';
    safeLog.card_number = `****${requestData.card_number.slice(-4)}`;
    safeLog.card_cvv = '***';
    console.log(`[DEBUG][SUBLYTICS] Request payload (masked):`, JSON.stringify(safeLog, null, 2));
    try {
      console.log(`[DEBUG][SUBLYTICS] Sending POST request...`);
      const startTime = Date.now();

      const response = await axios.post(sublyticsUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const elapsed = Date.now() - startTime;
      console.log(`[DEBUG][SUBLYTICS] Response received in ${elapsed}ms`);
      console.log(`[DEBUG][SUBLYTICS] HTTP Status: ${response.status}`);
      console.log(`[DEBUG][SUBLYTICS] Response body:`, JSON.stringify(response.data, null, 2));

      const isSuccess = response.data.success !== undefined ? response.data.success : true;
      console.log(`[DEBUG][SUBLYTICS] Interpreted success: ${isSuccess}`);
      console.log(`[DEBUG][SUBLYTICS] ──── API CALL END ────`);

      return {
        success: isSuccess,
        data: response.data,
        payload: requestData
      };
    } catch (error) {
      const elapsed = Date.now() - (error.config?._startTime || Date.now());
      console.error(`[DEBUG][SUBLYTICS] ──── API CALL ERROR ────`);
      console.error(`[DEBUG][SUBLYTICS] Error type: ${error.code || 'UNKNOWN'}`);
      console.error(`[DEBUG][SUBLYTICS] Message: ${error.message}`);
      if (error.response) {
        console.error(`[DEBUG][SUBLYTICS] HTTP Status: ${error.response.status}`);
        console.error(`[DEBUG][SUBLYTICS] Error response:`, JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: error.response?.data || null,
        payload: requestData
      };
    }
  }
}

export default new SublyticsService();

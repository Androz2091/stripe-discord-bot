import pQueue from 'p-queue';

const queue = new pQueue({ concurrency: 1, interval: 500, intervalCap: 1 });

/**
 * Gets the Stripe customer ID for a given user email
 */
export const resolveCustomerIdFromEmail = async (email: string) => {
    let customerData;
    
    if (email.includes('+')) {
        const endPart = email.split('+')[1];
        const customers = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/customers/search?query=email~'${endPart}'`, {
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        })).json());
        const matchingCustomers = customers.data.filter((c: any) => c.email === email);
        customerData = matchingCustomers[0];
    } else {
        const customers = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${email}'`, {
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
            }
        })).json());
        customerData = customers.data[0];
    }

    return customerData?.id;
}

/**
 * Gets all the Stripe subscriptions from a given customer ID
 */
export const findSubscriptionsFromCustomerId = async (oldCustomerId: string) => {
    const subscriptions = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/subscriptions?customer=${oldCustomerId}`, {
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
        }
    })).json());
    return subscriptions.data || [];
}

/**
 * Filter the active subscriptions from a list of subscriptions
 */
export const findActiveSubscriptions = (subscriptions: any[]) => {
    return subscriptions.filter(sub => sub.status === 'active' || sub.status === 'trialing' || (sub.cancel_at && sub.current_period_end > Date.now() / 1000));
}

/**
 * Gets all the Stripe payments from a given customer ID
 */
export const getCustomerPayments = async (customerId: string) => {
    const invoices = await queue.add(async () => await (await fetch(`https://api.stripe.com/v1/payment_intents?customer=${customerId}`, {
        headers: {
            Authorization: `Bearer ${process.env.STRIPE_API_KEY}`
        }
    })).json());
    return invoices?.data || [];
}

/**
 * Gets the lifetime payment date from a list of payments
 */
export const getLifetimePaymentDate = (payments: any[]): null|number => {
    let lifetimeStartDate = null;
    for (const payment of (payments || [])) {
        for (const charge of (payment.charges?.data || [])) {
            if (charge.description.includes(process.env.LIFETIME_INVOICE_LABEL_KEYWORD)) {
                lifetimeStartDate = charge.created * 1000;
            }
        }
    }
    return lifetimeStartDate;
}

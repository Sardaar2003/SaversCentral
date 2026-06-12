// Centralized configuration schema for dynamic form rendering and client-side validation
// Add new projects/fields here to automatically update the Submission page UI.

export const cardTypes = [
  { value: 1, label: 'Mastercard' },
  { value: 2, label: 'Visa' },
  { value: 3, label: 'Discover' },
  { value: 4, label: 'American Express' },
];

export const cardMonths = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1;
  const str = month < 10 ? `0${month}` : `${month}`;
  return { value: str, label: str };
});

const currentYear = new Date().getFullYear();
export const cardYears = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear + i;
  return { value: String(year), label: String(year) };
});

export const formSections = [
  {
    id: 'customer_info',
    title: 'Customer Information',
    fields: [
      {
        name: 'bill_fname',
        label: 'First Name',
        type: 'text',
        placeholder: 'John',
        required: true,
        gridSpan: 1,
      },
      {
        name: 'bill_lname',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
        required: true,
        gridSpan: 1,
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'johndoe@email.com',
        required: true,
        gridSpan: 1,
        validate: (value, formData) => {
          if (!value) return 'Email is required';
          const emailLower = value.toLowerCase().trim();
          const blocked = ['noemail@noemail.com', 'test@test.com', 'admin@admin.com', 'user@user.com', 'no-email@noemail.com'];
          
          if (blocked.includes(emailLower) || emailLower.startsWith('noemail@')) {
            const fname = formData.bill_fname ? formData.bill_fname.replace(/\s+/g, '') : 'john';
            const lname = formData.bill_lname ? formData.bill_lname.replace(/\s+/g, '') : 'doe';
            const phone = formData.phone ? formData.phone.replace(/[^0-9]/g, '') : '1234567890';
            return `Generic email addresses are not accepted. Try: ${fname.toLowerCase()}${lname.toLowerCase()}@noemail.com or ${phone}@noemail.com`;
          }
          // Simple email regex
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email address format';
          }
          return null;
        }
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '1234567890',
        required: true,
        gridSpan: 1,
        validate: (value) => {
          if (!value) return 'Phone number is required';
          const digits = value.replace(/[^0-9]/g, '');
          if (digits.length < 10) return 'Phone number must be at least 10 digits';
          return null;
        }
      }
    ]
  },
  {
    id: 'billing_address',
    title: 'Billing Address',
    fields: [
      {
        name: 'bill_address1',
        label: 'Address Line 1',
        type: 'text',
        placeholder: '123 Main St',
        required: true,
        gridSpan: 2,
      },
      {
        name: 'bill_city',
        label: 'City',
        type: 'text',
        placeholder: 'Los Angeles',
        required: true,
        gridSpan: 1,
      },
      {
        name: 'bill_state',
        label: 'State',
        type: 'text',
        placeholder: 'CA',
        required: true,
        gridSpan: 1,
      },
      {
        name: 'bill_zipcode',
        label: 'Zip Code',
        type: 'text',
        placeholder: '90001',
        required: true,
        gridSpan: 1,
        validate: (value) => {
          if (!value) return 'Zip code is required';
          if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Zip code must be 5 digits (e.g. 90210)';
          return null;
        }
      },
      {
        name: 'bill_country',
        label: 'Country',
        type: 'select',
        required: true,
        gridSpan: 1,
        defaultValue: 'US',
        options: [
          { value: 'US', label: 'United States' },
          { value: 'CA', label: 'Canada' },
          { value: 'GB', label: 'United Kingdom' }
        ]
      }
    ]
  },
  {
    id: 'payment_details',
    title: 'Payment Details',
    fields: [
      {
        name: 'card_type_id',
        label: 'Card Type',
        type: 'select',
        required: true,
        gridSpan: 1,
        defaultValue: '2', // Default to Visa
        options: cardTypes,
      },
      {
        name: 'card_number',
        label: 'Card Number',
        type: 'text',
        placeholder: '4111 2222 3333 4444',
        required: true,
        gridSpan: 1,
        validate: (value) => {
          if (!value) return 'Card number is required';
          const cleanVal = value.replace(/\s+/g, '');
          if (!/^\d{13,19}$/.test(cleanVal)) return 'Card number must be between 13 and 19 digits';
          return null;
        }
      },
      {
        name: 'card_exp_month',
        label: 'Expiration Month',
        type: 'select',
        required: true,
        gridSpan: 1,
        defaultValue: '01',
        options: cardMonths,
      },
      {
        name: 'card_exp_year',
        label: 'Expiration Year',
        type: 'select',
        required: true,
        gridSpan: 1,
        defaultValue: String(currentYear),
        options: cardYears,
      },
      {
        name: 'card_cvv',
        label: 'CVV',
        type: 'password',
        placeholder: '123',
        required: true,
        gridSpan: 1,
        validate: (value) => {
          if (!value) return 'CVV is required';
          if (!/^\d{3,4}$/.test(value)) return 'CVV must be 3 or 4 digits';
          return null;
        }
      }
    ]
  }
];

// Helper to initialize blank form states based on schema
export const getInitialFormState = () => {
  const state = {
    projectId: '',
    shipping_same: true,
    ship_fname: '',
    ship_lname: '',
    ship_address1: '',
    ship_city: '',
    ship_state: '',
    ship_zipcode: '',
    ship_country: 'US',
  };

  formSections.forEach(section => {
    section.fields.forEach(field => {
      state[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
    });
  });

  return state;
};

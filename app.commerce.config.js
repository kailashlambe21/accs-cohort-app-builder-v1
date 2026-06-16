const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");

module.exports = defineConfig({
  metadata: {
    id: "kailash-accs-sample-app",
    displayName: "Kailash ACCS Sample App",
    version: "1.0.0",
    description:
      "A sample Adobe Commerce application demonstrating the use of webhooks/events.",
  },
  webhooks: [
    {
      label: "Product Validation",
      description: "Validates product data before save.",
      category: "validation",
      runtimeAction: "course-labs/validate-product",
      webhook: {
        webhook_method: "observer.catalog_product_save_before",
        webhook_type: "before",
        batch_name: "product_validation_batch",
        hook_name: "validate_product",
        method: "POST",
        fields: [
          { name: "sku", source: "product.sku" },
          { name: "name", source: "product.name" },
        ],
      },
    },
  ],
  eventing: {
    commerce: [
      {
        provider: {
          label: "Commerce Events",
          description: "Events from Adobe Commerce for order processing.",
        },
        events: [
          {
            name: "observer.sales_order_save_after",
            label: "Order Saved",
            description: "Triggered when an order is saved in Commerce.",
            runtimeActions: ["course-labs/order-event-consumer"],
            fields: [
              { name: "order_id" },
            ],
          },
        ],
      },
    ],
  },
  adminUiSdk: {
    registration: {
      menuItems: [
        {
          id: 'order_enrichment_admin::apps',
          title: 'Order Enrichment',
          isSection: true,
          sortOrder: 100,
        },
        {
          id: 'order_enrichment_admin::enriched_orders',
          title: 'Enriched Orders',
          parent: 'order_enrichment_admin::apps',
          sortOrder: 1,
        },
      ],
    },
  },
});

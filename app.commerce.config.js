const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");

module.exports = defineConfig({
  metadata: {
    id: "my-application",
    displayName: "My Application",
    version: "1.0.0",
    description:
      "A custom Adobe Commerce application. Fill description for your app.",
  },
  webhooks: [
    {
      label: "Sample Webhook",
      description: "A sample Commerce Webhook handler.",
      runtimeAction: "my-package/handle-webhook",
      category: "modification",
      webhook: {
        webhook_method: "plugin.sample.event",
        webhook_type: "after",
        batch_name: "my_app",
        hook_name: "sample_hook",
        method: "POST",
      },
    },
    {
      label: "Sample Webhook with URL",
      description: "A sample Commerce Webhook handler using an explicit URL.",
      category: "modification",
      webhook: {
        webhook_method: "plugin.sample.event",
        webhook_type: "after",
        batch_name: "my_app",
        hook_name: "sample_hook_url",
        method: "POST",
        url: "https://example.com/webhook",
      },
    },
  ],
});

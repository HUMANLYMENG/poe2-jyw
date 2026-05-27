export default {
  manifest: {
    permissions: ["storage", "activeTab"],
    host_permissions: [
      "https://www.pathofexile.com/*",
      "https://api.pathofexile.com/*",
    ],
    web_accessible_resources: [
      {
        resources: ["data/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
}

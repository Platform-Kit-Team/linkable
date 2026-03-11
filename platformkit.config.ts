import type { PlatformKitConfig } from "./src/lib/config";

/**
 * Root platform-level config.
 *
 * Theme-specific settings (collections, build hooks, etc.) belong in the
 * active theme's platformkit.build.ts — NOT here.
 *
 * User overrides go in src/overrides/platformkit.config.ts (or staged there
 * by the CLI from the user's content directory).
 *
 * Merge order: root → theme → user overrides (deep merge, buildHooks concatenated).
 */
const config: PlatformKitConfig = {
	contentCollections: {
		products: {
			directory: "content/products",
			format: "yaml",
			version: 1,
			label: "Products",
			icon: "ShoppingCart",
			itemSchema: [
				{
					$formkit: "select",
					name: "product_type",
					label: "Product Type",
					validation: "required",
					options: [
						{ label: "Physical", value: "physical" },
						{ label: "Digital", value: "digital" },
						{ label: "Subscription", value: "subscription" },
					],
				},
				{
					$formkit: "text",
					name: "name",
					label: "Product Name",
					validation: "required",
				},
				{
					$formkit: "textarea",
					name: "description",
					label: "Description",
				},
				{
					$formkit: "listPanel",
					name: "images",
					label: "Images",
					children: [{ $formkit: "image-upload", name: "image", label: "Image" }],
				},
				{
					$formkit: "checkbox",
					name: "shippable",
					label: "Shippable",
					if: "$product_type == 'physical'",
				},
				{
					$formkit: "listPanel",
					name: "attributes",
					label: "Attributes (Options)",
					if: "$product_type == 'physical'",
					help: "Define product options (e.g. Size, Color). Each attribute can have multiple values.",
					ui: { collapsible: true, collapsed: true, summaryField: "name" },
					children: [
						{
							$formkit: "group",
							name: "attribute",
							label: "Attribute",
							children: [
								{
									$formkit: "text",
									name: "name",
									label: "Attribute Name",
								},
								{
									$formkit: "listPanel",
									name: "values",
									label: "Values",
									children: [{ $formkit: "text", name: "value", label: "Value" }],
								},
							],
						},
					],
				},
				{
					$formkit: "listPanel",
					name: "variants",
					label: "Variants (SKUs)",
					if: "$product_type == 'physical'",
					help: "Each variant is a unique combination of attributes (e.g. Size: M, Color: Blue) with its own SKU and inventory.",
					ui: { collapsible: true, collapsed: true, summaryField: "sku" },
					children: [
						{
							$formkit: "group",
							name: "variant",
							label: "Variant",
							children: [
								{
									$formkit: "text",
									name: "sku",
									label: "SKU",
								},
								{
									$formkit: "listPanel",
									name: "attributes",
									label: "Attributes",
									children: [
										{
											$formkit: "group",
											name: "attribute",
											label: "Attribute",
											children: [
												{
													$formkit: "text",
													name: "name",
													label: "Attribute Name",
												},
												{
													$formkit: "text",
													name: "value",
													label: "Value",
												},
											],
										},
									],
								},
								{
									$formkit: "number",
									name: "inventory",
									label: "Inventory",
								},
							],
						},
					],
				},
				{
					$formkit: "listPanel",
					name: "metadata",
					label: "Product Metadata",
					help: "Custom key-value pairs for this product.",
					ui: { collapsible: true, collapsed: true, summaryField: "key" },
					children: [
						{
							$formkit: "group",
							name: "meta",
							label: "Meta",
							children: [
								{
									$formkit: "text",
									name: "key",
									label: "Key",
								},
								{
									$formkit: "text",
									name: "value",
									label: "Value",
								},
							],
						},
					],
				},
				{ $formkit: "text", name: "stripe_product_id", label: "Stripe Product ID" },
				{
					$formkit: "listPanel",
					name: "extra",
					label: "Extra Stripe Fields",
					help: "Advanced: Add any extra fields for Stripe sync.",
					ui: { collapsible: true, collapsed: true, summaryField: "key" },
					children: [
						{
							$formkit: "group",
							name: "extraField",
							label: "Extra Field",
							children: [
								{
									$formkit: "text",
									name: "key",
									label: "Key",
								},
								{
									$formkit: "text",
									name: "value",
									label: "Value",
								},
							],
						},
					],
				},
			],
			newItem: () => ({
				name: "",
				description: "",
				images: [],
				shippable: false,
				attributes: [],
				variants: [],
				metadata: {},
				prices: [],
				stripe_product_id: "",
				extra: {},
			}),
			itemLabel: (item: any) => item.title,
			itemThumbnail: (item: any) => item.image,
		},
	},
};

export default config;

# Content Management & Branding System Documentation

## Overview

This document describes the comprehensive content management and branding system that provides admins with full control over site content, branding, and feature toggles. The system allows for dynamic content updates without code changes and includes runtime feature flags.

## Features Implemented

### 1. **Branding Management**

- **Brand Identity**: Brand name, tagline, logo, favicon
- **Color Scheme**: Primary, secondary, and accent colors with live preview
- **Typography**: Font family selection
- **Visual Assets**: Logo and favicon URL management

### 2. **SEO & Meta Management**

- **Site Title**: Dynamic page titles
- **Meta Description**: SEO-optimized descriptions
- **Search Engine Optimization**: Complete meta tag control

### 3. **Contact & Social Management**

- **Contact Information**: Email, phone, address
- **Social Media Links**: Twitter, LinkedIn, Instagram, Facebook
- **Communication Channels**: Centralized contact management

### 4. **Content Blocks System**

- **Dynamic Content**: Hero sections, features, testimonials, footer
- **Content Types**: Text, HTML, JSON, Image support
- **Categorization**: Organized content by sections
- **Sort Order**: Custom ordering of content blocks
- **Active/Inactive**: Toggle content visibility

### 5. **Feature Toggles & Runtime Controls**

- **Maintenance Mode**: Site-wide maintenance toggle
- **Feature Flags**: Enable/disable features without deployment
- **Runtime Controls**: Real-time feature management
- **Category Organization**: Grouped feature toggles

### 6. **Admin Interface**

- **Tabbed Interface**: Organized by functionality
- **Real-time Updates**: Live preview of changes
- **Bulk Operations**: Manage multiple settings at once
- **Validation**: Input validation and error handling

## Technical Implementation

### Database Schema

#### SiteSettings Model

```sql
model SiteSettings {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String
  type      String   @default("string") // string, json, boolean, number
  category  String   @default("general") // branding, content, seo, social, features
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

#### ContentBlock Model

```sql
model ContentBlock {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  title       String
  content     String
  type        String   @default("text") // text, html, json, image
  category    String   @default("general") // hero, features, testimonials, footer
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  metadata    String?  // JSON string for additional data
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
}
```

#### FeatureToggle Model

```sql
model FeatureToggle {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  name        String
  description String?
  isEnabled   Boolean  @default(false) @map("is_enabled")
  category    String   @default("general")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
}
```

### API Endpoints

#### Admin Management

- `GET/POST /api/admin/site-settings` - Manage site settings
- `GET/POST /api/admin/content-blocks` - Manage content blocks
- `GET/PUT/DELETE /api/admin/content-blocks/[id]` - CRUD content blocks
- `GET/POST /api/admin/feature-toggles` - Manage feature toggles
- `GET/PUT/DELETE /api/admin/feature-toggles/[id]` - CRUD feature toggles

#### Public Access

- `GET /api/site-content` - Public access to site content
- `GET /api/site-content?category=branding` - Filtered content access

### React Hooks

#### useSiteContent Hook

```javascript
const { settings, contentBlocks, featureToggles, loading, error } = useSiteContent();
```

#### Specialized Hooks

```javascript
// Feature toggles
const { isEnabled } = useFeatureToggle("maintenanceMode");

// Settings
const { value } = useSetting("brandName", "Default Brand");

// Content blocks
const { block } = useContentBlock("hero-headline");

// Category-specific
const { settings: branding } = useBranding();
const { settings: seo } = useSEO();
const { settings: contact } = useContact();
const { settings: social } = useSocial();
```

### Server-side Utilities

#### Site Content Library

```javascript
// Get all content
const content = await getAllSiteContent();

// Get specific content
const settings = await getSiteSettings("branding");
const blocks = await getContentBlocks("hero");
const toggles = await getFeatureToggles("features");

// Check features
const isMaintenanceMode = await isMaintenanceMode();
const isFeatureEnabled = await isFeatureEnabled("showSignup");
```

## Usage Guide

### For Admins

#### Managing Branding

1. Navigate to `/admin/content`
2. Go to "Branding & SEO" tab
3. Update brand information:
   - Brand name and tagline
   - Logo and favicon URLs
   - Color scheme (with live preview)
   - Font family selection
4. Click "Save Settings"

#### Managing Content Blocks

1. Go to "Content Blocks" tab
2. Click "Create Content Block"
3. Fill in the form:
   - **Key**: Unique identifier (e.g., "hero-headline")
   - **Title**: Display name
   - **Content**: The actual content
   - **Type**: Text, HTML, JSON, or Image
   - **Category**: Hero, Features, Testimonials, Footer
   - **Sort Order**: Display order
   - **Active**: Enable/disable
4. Save the content block

#### Managing Feature Toggles

1. Go to "Feature Toggles" tab
2. Click "Create Feature Toggle"
3. Configure the toggle:
   - **Key**: Unique identifier (e.g., "maintenanceMode")
   - **Name**: Display name
   - **Description**: What this toggle does
   - **Category**: Grouping (General, Features, UI, API)
   - **Enabled**: Current state
4. Toggle features on/off as needed

### For Developers

#### Using Site Content in Components

```javascript
import { useBranding, useContentBlock, useFeatureToggle } from "@/hooks/useSiteContent";

function HeroSection() {
  const { settings: branding } = useBranding();
  const { block: headline } = useContentBlock("hero-headline");
  const { isEnabled: showSignup } = useFeatureToggle("showSignup");

  return (
    <div style={{ backgroundColor: branding.primaryColor }}>
      <h1>{headline?.content || "Default Headline"}</h1>
      {showSignup && <SignupButton />}
    </div>
  );
}
```

#### Server-side Content Loading

```javascript
import { getSiteSettings, getContentBlocks } from "@/lib/site-content";

export async function getServerSideProps() {
  const [branding, heroBlocks] = await Promise.all([getSiteSettings("branding"), getContentBlocks("hero")]);

  return {
    props: {
      branding,
      heroBlocks,
    },
  };
}
```

#### Middleware Integration

The system includes middleware that automatically:

- Checks maintenance mode
- Redirects users to maintenance page when enabled
- Allows admin users to bypass maintenance mode

## Content Categories

### Branding Settings

- `brandName`: Site/brand name
- `brandTagline`: Brand tagline or slogan
- `logoUrl`: Logo image URL
- `faviconUrl`: Favicon URL
- `primaryColor`: Primary brand color (hex)
- `secondaryColor`: Secondary brand color (hex)
- `accentColor`: Accent color (hex)
- `fontFamily`: Typography font family

### SEO Settings

- `siteTitle`: Default page title
- `metaDescription`: Default meta description

### Contact Settings

- `contactEmail`: Support/contact email
- `contactPhone`: Contact phone number
- `contactAddress`: Business address

### Social Settings

- `socialTwitter`: Twitter profile URL
- `socialLinkedin`: LinkedIn profile URL
- `socialInstagram`: Instagram profile URL
- `socialFacebook`: Facebook page URL

### Feature Toggles

- `maintenanceMode`: Enable/disable maintenance mode
- `showSignup`: Show/hide signup functionality
- `enableComments`: Enable/disable comments
- `enableFeedback`: Enable/disable feedback system
- `enableAnalytics`: Enable/disable analytics tracking

## Content Block Categories

### Hero Section

- `hero-headline`: Main headline
- `hero-subheadline`: Supporting text
- `hero-cta-text`: Call-to-action button text
- `hero-cta-url`: Call-to-action button URL

### Features Section

- `feature-1-title`: First feature title
- `feature-1-description`: First feature description
- `feature-2-title`: Second feature title
- `feature-2-description`: Second feature description
- (Continue for additional features)

### Testimonials

- `testimonial-1-name`: First testimonial author
- `testimonial-1-role`: First testimonial role
- `testimonial-1-quote`: First testimonial quote
- (Continue for additional testimonials)

### Footer

- `footer-copyright`: Copyright text
- `footer-links`: Footer navigation links (JSON)

## Setup and Initialization

### 1. Database Migration

```bash
npx prisma migrate dev --name add_content_management
```

### 2. Initialize Default Content

```bash
node scripts/init-site-content.js
```

### 3. Environment Variables

Ensure these are set in your `.env` file:

```env
DATABASE_URL="your_database_url"
NEXTAUTH_SECRET="your_secret"
```

## Best Practices

### For Admins

1. **Test Changes**: Always test changes in a staging environment
2. **Backup Content**: Export content before major changes
3. **Use Descriptive Keys**: Use clear, descriptive keys for content blocks
4. **Organize Categories**: Keep content organized by categories
5. **Monitor Performance**: Check site performance after changes

### For Developers

1. **Use Hooks**: Leverage the provided React hooks for content
2. **Handle Loading States**: Always handle loading and error states
3. **Provide Fallbacks**: Include fallback content for missing blocks
4. **Type Safety**: Use TypeScript for better type safety
5. **Cache Content**: Consider caching for better performance

## Security Considerations

1. **Admin Authentication**: All admin endpoints require authentication
2. **Input Validation**: All inputs are validated server-side
3. **SQL Injection**: Using Prisma ORM prevents SQL injection
4. **XSS Prevention**: Content is properly escaped in the UI
5. **Rate Limiting**: Consider adding rate limiting to admin endpoints

## Performance Optimization

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Caching**: Consider Redis caching for frequently accessed content
3. **CDN**: Use CDN for static assets like logos and images
4. **Lazy Loading**: Load content blocks only when needed
5. **Compression**: Enable gzip compression for API responses

## Troubleshooting

### Common Issues

1. **Content Not Updating**

   - Check if content block is active
   - Verify the key is correct
   - Clear browser cache

2. **Feature Toggle Not Working**

   - Verify the toggle key matches exactly
   - Check if the toggle is enabled
   - Restart the application if needed

3. **Maintenance Mode Stuck**
   - Check database for maintenanceMode toggle
   - Verify middleware configuration
   - Check admin authentication

### Debug Steps

1. Check database directly for content
2. Verify API endpoints are working
3. Check browser network tab for errors
4. Review server logs for errors
5. Test with different user roles

## Future Enhancements

Potential improvements for the content management system:

1. **Version Control**: Track changes and allow rollbacks
2. **A/B Testing**: Built-in A/B testing for content
3. **Scheduling**: Schedule content changes for future dates
4. **Multi-language**: Support for multiple languages
5. **Rich Text Editor**: WYSIWYG editor for content blocks
6. **Image Management**: Built-in image upload and management
7. **Analytics**: Track content performance and engagement
8. **Templates**: Pre-built content templates
9. **Workflow**: Content approval workflows
10. **API Documentation**: Auto-generated API documentation

## Support

For technical support or questions about the content management system:

1. Check this documentation first
2. Review the code examples
3. Check server logs for error details
4. Contact the development team with specific error messages
5. Provide steps to reproduce any issues

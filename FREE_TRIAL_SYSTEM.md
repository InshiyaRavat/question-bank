# Free Trial System Documentation

## Overview

The Free Trial System allows users without active subscriptions to access limited features, encouraging them to upgrade to premium plans. This system provides:

- **Daily Question Limits**: Users can attempt a limited number of questions per day
- **Topic Restrictions**: Only selected topics are available for free trial users
- **Admin Controls**: Full administrative control over trial settings
- **Usage Tracking**: Detailed tracking of user trial usage

## Features

### For Users

- ✅ Limited daily questions (configurable by admin)
- ✅ Access to selected topics only
- ✅ Real-time usage tracking
- ✅ Clear upgrade prompts when limits are reached
- ✅ Daily reset at midnight

### For Admins

- ✅ Configure daily question limits (1-100 questions)
- ✅ Select which topics are available in free trial
- ✅ Enable/disable free trial system
- ✅ View usage statistics
- ✅ Audit trail of all changes

## Database Schema

### FreeTrialSettings

```sql
model FreeTrialSettings {
  id                    Int      @id @default(autoincrement())
  dailyQuestionLimit    Int      @default(5) @map("daily_question_limit")
  allowedTopics         Int[]    @default([]) @map("allowed_topics")
  isActive              Boolean  @default(true) @map("is_active")
  description           String?  @default("Free trial allows limited daily questions from selected topics")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  updatedBy             String?  @map("updated_by")
}
```

### UserFreeTrialUsage

```sql
model UserFreeTrialUsage {
  id              Int      @id @default(autoincrement())
  userId          String   @map("user_id")
  date            DateTime @map("date")
  questionsUsed   Int      @default(0) @map("questions_used")
  topicId         Int      @map("topic_id")
  createdAt       DateTime @default(now()) @map("created_at")
}
```

## API Endpoints

### Admin Endpoints

#### GET /api/admin/free-trial-settings

Get current free trial settings.

**Response:**

```json
{
  "success": true,
  "settings": {
    "dailyQuestionLimit": 5,
    "allowedTopics": [1, 2, 3],
    "isActive": true,
    "description": "Free trial description"
  }
}
```

#### POST /api/admin/free-trial-settings

Update free trial settings.

**Request Body:**

```json
{
  "dailyQuestionLimit": 10,
  "allowedTopics": [1, 2, 3, 4],
  "isActive": true,
  "description": "Updated description"
}
```

### User Endpoints

#### GET /api/free-trial/status

Get user's free trial status and limits.

**Response:**

```json
{
  "success": true,
  "isFreeTrial": true,
  "hasSubscription": false,
  "settings": {
    "dailyQuestionLimit": 5,
    "questionsUsed": 2,
    "questionsRemaining": 3,
    "allowedTopics": [{ "id": 1, "name": "Math", "noOfQuestions": 50 }],
    "description": "Free trial description"
  }
}
```

#### POST /api/free-trial/usage

Record free trial question usage.

**Request Body:**

```json
{
  "topicId": 1,
  "questionsCount": 1
}
```

## React Components

### useFreeTrial Hook

```javascript
import { useFreeTrial } from "@/hooks/useFreeTrial";

function MyComponent() {
  const { freeTrialStatus, loading, error, canAttemptQuestions, recordUsage, isTopicAllowed, getRemainingQuestions } =
    useFreeTrial();

  // Use the hook methods
}
```

### FreeTrialStatus Component

Shows user their current free trial status and limits.

```jsx
import FreeTrialStatus from "@/components/FreeTrial/FreeTrialStatus";

<FreeTrialStatus />;
```

### FreeTrialRestriction Component

Shows restrictions and upgrade prompts.

```jsx
import FreeTrialRestriction from "@/components/FreeTrial/FreeTrialRestriction";

<FreeTrialRestriction topicId={topicId} questionCount={1} onRefresh={() => window.location.reload()} />;
```

## Setup Instructions

### 1. Database Migration

```bash
npx prisma migrate dev --name add_free_trial_system
```

### 2. Initialize Default Settings

```bash
node scripts/setup-free-trial.js
```

### 3. Access Admin Panel

Navigate to `/admin/free-trial-settings` to configure the system.

## Integration Examples

### Basic Question Component Integration

```jsx
import { useFreeTrial } from "@/hooks/useFreeTrial";
import FreeTrialRestriction from "@/components/FreeTrial/FreeTrialRestriction";

function QuestionComponent({ topicId, question }) {
  const { canAttemptQuestions, recordUsage, isFreeTrial } = useFreeTrial();

  const handleAnswer = async (answer) => {
    const check = canAttemptQuestions(topicId, 1);

    if (!check.allowed) {
      // Show restriction message
      return;
    }

    // Record usage if in free trial
    if (isFreeTrial) {
      await recordUsage(topicId, 1);
    }

    // Process answer
    processAnswer(answer);
  };

  return (
    <div>
      <FreeTrialRestriction topicId={topicId} questionCount={1} />
      {/* Question content */}
    </div>
  );
}
```

### Topic List Integration

```jsx
import { useFreeTrial } from "@/hooks/useFreeTrial";

function TopicList({ topics }) {
  const { isTopicAllowed, isFreeTrial } = useFreeTrial();

  return (
    <div>
      {topics.map((topic) => (
        <div key={topic.id} className={!isTopicAllowed(topic.id) ? "opacity-50" : ""}>
          {topic.name}
          {!isTopicAllowed(topic.id) && isFreeTrial && <Badge variant="outline">Premium Only</Badge>}
        </div>
      ))}
    </div>
  );
}
```

## Configuration Options

### Daily Question Limits

- **Range**: 1-100 questions per day
- **Default**: 5 questions
- **Reset**: Daily at midnight (user's timezone)

### Topic Selection

- **Selection**: Choose any combination of available topics
- **Validation**: Only non-deleted topics can be selected
- **Default**: All topics (when first set up)

### System Control

- **Enable/Disable**: Toggle free trial system on/off
- **Description**: Custom message shown to users
- **Audit Trail**: All changes are logged with admin details

## Usage Tracking

### Daily Usage

- Tracks questions attempted per topic per day
- Resets automatically at midnight
- Prevents exceeding daily limits

### Analytics

- Total questions used per day
- Questions remaining
- Topic-specific usage
- Historical usage data

## Security Considerations

### Rate Limiting

- Server-side validation of all limits
- Prevents client-side bypassing
- Atomic operations for usage tracking

### Data Privacy

- Usage data is tied to user accounts
- No personal information in usage logs
- GDPR compliant data handling

## Troubleshooting

### Common Issues

1. **Free trial not working**

   - Check if `isActive` is true in settings
   - Verify user doesn't have active subscription
   - Check database connection

2. **Limits not enforced**

   - Verify API endpoints are being called
   - Check server-side validation
   - Review usage tracking logic

3. **Admin panel not loading**
   - Check authentication
   - Verify admin role permissions
   - Review API endpoint responses

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

## Future Enhancements

### Planned Features

- [ ] Weekly question limits
- [ ] Time-based restrictions (e.g., 2 hours per day)
- [ ] Progressive limits (more questions over time)
- [ ] A/B testing for different trial configurations
- [ ] Email notifications for trial limits
- [ ] Advanced analytics dashboard

### Integration Opportunities

- [ ] Stripe integration for seamless upgrades
- [ ] Email marketing automation
- [ ] User behavior analytics
- [ ] Conversion tracking

## Support

For issues or questions about the Free Trial System:

1. Check the troubleshooting section
2. Review the API documentation
3. Check admin activity logs
4. Contact the development team

## Changelog

### v1.0.0 (Initial Release)

- ✅ Basic free trial system
- ✅ Admin configuration panel
- ✅ Daily question limits
- ✅ Topic restrictions
- ✅ Usage tracking
- ✅ React components and hooks
- ✅ API endpoints
- ✅ Database schema

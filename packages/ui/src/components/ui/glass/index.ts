/**
 * @file Glass UI component exports
 *
 *   Glass components provide a glassmorphism aesthetic with blur, transparency,
 *   and subtle outline effects. These are enhanced versions of the base
 *   components with glass-specific defaults.
 * @example
 *   ```tsx
 *   import { GlassButton, GlassDialog, GlassDialogContent } from "@convergence/ui";
 *
 *   <GlassDialog>
 *     <GlassDialogContent>
 *       <GlassButton effect="glow">Click me</GlassButton>
 *     </GlassDialogContent>
 *   </GlassDialog>
 *   ```;
 */

// Accordion
export {
  Accordion as GlassAccordion,
  AccordionItem as GlassAccordionItem,
  AccordionContent as GlassAccordionContent,
  AccordionTrigger as GlassAccordionTrigger,
  type AccordionTriggerProps as GlassAccordionTriggerProps,
} from "./accordion";

// Alert
export {
  Alert as GlassAlert,
  AlertTitle as GlassAlertTitle,
  AlertDescription as GlassAlertDescription,
  type AlertProps as GlassAlertProps,
} from "./alert";

// Alert Dialog
export {
  AlertDialog as GlassAlertDialog,
  AlertDialogTrigger as GlassAlertDialogTrigger,
  AlertDialogContent as GlassAlertDialogContent,
  AlertDialogHeader as GlassAlertDialogHeader,
  AlertDialogFooter as GlassAlertDialogFooter,
  AlertDialogTitle as GlassAlertDialogTitle,
  AlertDialogDescription as GlassAlertDialogDescription,
  AlertDialogAction as GlassAlertDialogAction,
  AlertDialogCancel as GlassAlertDialogCancel,
  type AlertDialogContentProps as GlassAlertDialogContentProps,
} from "./alert-dialog";

// Button
export {
  Button as GlassButton,
  type ButtonProps as GlassButtonProps,
} from "./button";

// Dialog
export {
  Dialog as GlassDialog,
  DialogTrigger as GlassDialogTrigger,
  DialogContent as GlassDialogContent,
  DialogHeader as GlassDialogHeader,
  DialogFooter as GlassDialogFooter,
  DialogTitle as GlassDialogTitle,
  DialogDescription as GlassDialogDescription,
  type DialogContentProps as GlassDialogContentProps,
} from "./dialog";

// Avatar
export {
  Avatar as GlassAvatar,
  GlassAvatarImage,
  GlassAvatarFallback,
  type AvatarProps as GlassAvatarProps,
} from "./avatar";

// Badge
export {
  Badge as GlassBadge,
  type BadgeProps as GlassBadgeProps,
} from "./badge";

// Card
export {
  Card as GlassCard,
  CardHeader as GlassCardHeader,
  CardTitle as GlassCardTitle,
  CardDescription as GlassCardDescription,
  CardContent as GlassCardContent,
  CardFooter as GlassCardFooter,
  type CardProps as GlassCardProps,
} from "./card";

// Table
export {
  Table as GlassTable,
  TableHeader as GlassTableHeader,
  TableBody as GlassTableBody,
  TableFooter as GlassTableFooter,
  TableRow as GlassTableRow,
  TableHead as GlassTableHead,
  TableCell as GlassTableCell,
  TableCaption as GlassTableCaption,
  type TableProps as GlassTableProps,
} from "./table";

// Breadcrumb
export {
  BreadcrumbList as GlassBreadcrumbList,
  Breadcrumb as GlassBreadcrumb,
  BreadcrumbItem as GlassBreadcrumbItem,
  BreadcrumbLink as GlassBreadcrumbLink,
  BreadcrumbPage as GlassBreadcrumbPage,
  BreadcrumbSeparator as GlassBreadcrumbSeparator,
  BreadcrumbEllipsis as GlassBreadcrumbEllipsis,
  type BreadcrumbListProps as GlassBreadcrumbListProps,
} from "./breadcrumb";

// Button Group
export {
  ButtonGroup as GlassButtonGroup,
  type ButtonGroupProps as GlassButtonGroupProps,
} from "./button-group";

// Calendar
export {
  Calendar as GlassCalendar,
  type CalendarProps as GlassCalendarProps,
} from "./calendar";

// Carousel
export {
  Carousel as GlassCarousel,
  type CarouselProps as GlassCarouselProps,
} from "./carousel";

import { EventEmitter } from 'events';

export enum DomainEvent {
  ORDER_PAID_SUCCESS = 'ORDER_PAID_SUCCESS',
  SESSION_CHECKIN_GPS = 'SESSION_CHECKIN_GPS',
  ATTENDANCE_COMPLETED = 'ATTENDANCE_COMPLETED',
  ASSESSMENT_SUBMITTED = 'ASSESSMENT_SUBMITTED',
  COURSE_COMPLETED_AND_PASSED = 'COURSE_COMPLETED_AND_PASSED',
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_RESUMED = 'RESERVATION_RESUMED',
}

export interface OrderPaidPayload {
  orderId: string;
  studentId: string;
  branchId: string;
  items: Array<{
    itemType: 'COURSE' | 'COMBO' | 'PRODUCT';
    referenceId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface AttendanceCompletedPayload {
  classSessionId: string;
  teacherId: string;
  attendances: Array<{
    studentId: string;
    enrollmentId: string;
    status: 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';
    teacherComment?: string;
  }>;
}

export interface CourseCompletedPayload {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  finalScore: number;
  isPassed: boolean;
}

class InternalEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish<T = any>(event: DomainEvent, payload: T): void {
    console.log(`[EventBus] 📡 Dispatched Event: ${event}`, JSON.stringify(payload, null, 2));
    this.emit(event, payload);
  }

  subscribe<T = any>(event: DomainEvent, listener: (payload: T) => void | Promise<void>): void {
    this.on(event, async (payload: T) => {
      try {
        await listener(payload);
      } catch (error) {
        console.error(`[EventBus] ❌ Error in listener for ${event}:`, error);
      }
    });
  }
}

export const eventBus = new InternalEventBus();

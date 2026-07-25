import { toast } from 'sonner';
import { X } from 'lucide-react';

// Custom dark chip toast (spec §6): #14181f surface, state dot, copy that says
// what happened, manual dismiss, 4.2s auto-dismiss.
export function showToast(kind: 'success' | 'error', message: string) {
  toast.custom(
    (id) => (
      <div className="dl-toast" data-kind={kind} role="status">
        <span className="dot" />
        <span className="msg">{message}</span>
        <button type="button" className="x" aria-label="Dismiss" onClick={() => toast.dismiss(id)}>
          <X size={15} />
        </button>
      </div>
    ),
    { duration: 4200 },
  );
}

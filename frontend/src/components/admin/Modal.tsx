"use client";

import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={`w-full ${sizeClasses[size]} bg-slate-800 rounded-lg border border-slate-700 shadow-xl`}
            >
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                  <Dialog.Title className="text-xl font-bold text-white">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              )}
              <div className="px-6 py-4">{children}</div>
              {footer && (
                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-end space-x-3">
                  {footer}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

import { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useI18n } from "../../context/I18nContext.jsx";

const TRANSLATION_LOADER_CLASS = "translation-loader-popup";

export default function TranslationOverlay() {
  const { translating } = useI18n();
  const openedRef = useRef(false);

  useEffect(() => {
    if (translating) {
      openedRef.current = true;
      void Swal.fire({
        title: "Updating language...",
        text: "Please wait a moment.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          popup: TRANSLATION_LOADER_CLASS,
        },
        didOpen: () => {
          Swal.showLoading();
        },
      });
      return undefined;
    }

    const popup = Swal.getPopup();
    if (openedRef.current && popup?.classList.contains(TRANSLATION_LOADER_CLASS)) {
      Swal.close();
    }
    openedRef.current = false;
    return undefined;
  }, [translating]);

  useEffect(
    () => () => {
      const popup = Swal.getPopup();
      if (openedRef.current && popup?.classList.contains(TRANSLATION_LOADER_CLASS)) {
        Swal.close();
      }
    },
    [],
  );

  return null;
}

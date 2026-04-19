import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export interface TourStep {
  ref: React.RefObject<View | null>;
  titleKey: string;
  descKey: string;
  popupPosition: 'above' | 'below' | 'center';
  /** Callback ejecutado ANTES de medir el elemento (ej: cambiar tab).
   *  Cuando está presente, se espera `delay` ms (default 300) para que el layout nativo renderice. */
  onBeforeShow?: () => void;
  /** Milisegundos a esperar tras onBeforeShow antes de medir. Default: 300 */
  delay?: number;
}

interface TutorialOverlayProps {
  visible: boolean;
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PADDING = 6;
const OVERLAY_COLOR = 'rgba(0,0,0,0.65)';

// En Android, measureInWindow devuelve coords relativas al "window" (debajo del statusBar).
// El Modal con statusBarTranslucent cubre desde (0,0) físico.
// Hay que sumar el statusBar height para alinear correctamente.
const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

export default function TutorialOverlay({
  visible,
  steps,
  currentStep,
  onNext,
  onPrev,
  onClose,
}: TutorialOverlayProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const { width: SW, height: SH } = Dimensions.get('window');

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  useEffect(() => {
    if (!visible) return;
    const step = steps[currentStep];
    if (!step) return;

    let cancelled = false;

    const measureElement = () => {
      if (cancelled || !step.ref.current) {
        setHighlight(null);
        setTransitioning(false);
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          step.ref.current!.measureInWindow((x, y, width, height) => {
            if (cancelled) return;
            setHighlight({ x, y: y + STATUS_BAR_OFFSET, width, height });
            setTransitioning(false);
          });
        });
      });
    };

    if (typeof step.onBeforeShow === 'function') {
      // Llamar onBeforeShow SIEMPRE (aunque el ref sea null ahora, se montará después)
      step.onBeforeShow();
      // Ocultar popup y highlight durante la espera para evitar flash
      setHighlight(null);
      setTransitioning(true);
      const timer = setTimeout(measureElement, step.delay ?? 300);
      return () => { cancelled = true; clearTimeout(timer); };
    } else {
      setTransitioning(false);
      if (!step.ref.current) {
        setHighlight(null);
        return;
      }
      measureElement();
      return () => { cancelled = true; };
    }
  }, [visible, currentStep, steps]);

  if (!visible) return null;

  // Guard: si currentStep está fuera de rango (ej. doble tap rápido), cerrar
  if (currentStep >= steps.length) {
    onClose();
    return null;
  }

  const step = steps[currentStep];
  const title = t(step.titleKey as any);
  const desc = t(step.descKey as any);
  const stepLabel = `${currentStep + 1} ${t('tour.stepOf' as any)} ${steps.length}`;

  // Coordenadas del highlight con padding, recortadas a los límites de pantalla
  const hx = highlight ? Math.max(0, highlight.x - PADDING) : 0;
  const hy = highlight ? Math.max(0, highlight.y - PADDING) : 0;
  const hw = highlight ? Math.min(highlight.width + PADDING * 2, SW - hx - 1) : 0;
  const hh = highlight ? Math.min(highlight.height + PADDING * 2, SH - hy - 2) : 0;

  // Posición del popup
  const POPUP_MARGIN = 12;
  const POPUP_MAX_HEIGHT = 240;

  let popupTop: number | undefined;
  let popupBottom: number | undefined;

  if (!highlight || step.popupPosition === 'center') {
    popupTop = SH / 2 - POPUP_MAX_HEIGHT / 2;
  } else if (step.popupPosition === 'above') {
    popupBottom = SH - hy + POPUP_MARGIN;
  } else {
    // below
    popupTop = hy + hh + POPUP_MARGIN;
  }

  if (transitioning) {
    return (
      <Modal visible={visible} transparent statusBarTranslucent animationType="none">
        <View style={[styles.overlay, StyleSheet.absoluteFillObject]} />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Wrapper que cubre exactamente toda la pantalla — necesario para que
          los hijos con position:absolute usen coordenadas desde (0,0) físico */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {highlight ? (
          <>
            {/* top */}
            <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: hy }]} />
            {/* bottom */}
            <View style={[styles.overlay, { top: hy + hh, left: 0, right: 0, bottom: 0 }]} />
            {/* left */}
            <View style={[styles.overlay, { top: hy, left: 0, width: hx, height: hh }]} />
            {/* right */}
            <View style={[styles.overlay, { top: hy, left: hx + hw, right: 0, height: hh }]} />
            {/* highlight border — 4 líneas independientes para no quedar recortadas al edge */}
            <View style={[styles.borderLine, { top: hy,          left: hx,      width: hw, height: 2 }]} />
            <View style={[styles.borderLine, { top: hy + hh - 2, left: hx,      width: hw, height: 2 }]} />
            <View style={[styles.borderLine, { top: hy,          left: hx,      width: 2,  height: hh }]} />
            <View style={[styles.borderLine, { top: hy,          left: hx + hw - 2, width: 2, height: hh }]} />
          </>
        ) : (
          <View style={[styles.overlay, StyleSheet.absoluteFillObject]} />
        )}

        {/* Popup card */}
        <View
          style={[
            styles.popup,
            {
              backgroundColor: theme.colors.surface,
              top: popupTop,
              bottom: popupBottom,
              shadowColor: theme.colors.shadow ?? '#000',
            },
          ]}
        >
          {/* Step counter */}
          <Text style={[styles.stepCounter, { color: theme.colors.primary }]}>
            {stepLabel}
          </Text>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>

          {/* Description */}
          <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface }]}>
            {desc}
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.btnSkip}>
              <Text style={[styles.btnSkipText, { color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface }]}>
                {t('tour.skip' as any)}
              </Text>
            </TouchableOpacity>

            <View style={styles.navButtons}>
              {!isFirst && (
                <TouchableOpacity
                  onPress={onPrev}
                  activeOpacity={0.7}
                  style={[styles.btnNav, { borderColor: theme.colors.primary }]}
                >
                  <Text style={[styles.btnNavText, { color: theme.colors.primary }]}>
                    {t('tour.prev' as any)}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={isLast ? onClose : onNext}
                activeOpacity={0.7}
                style={[styles.btnPrimary, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.btnPrimaryText, { color: theme.colors.onPrimary ?? '#fff' }]}>
                  {isLast ? t('tour.finish' as any) : t('tour.next' as any)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: OVERLAY_COLOR,
  },
  highlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
  },
  borderLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  popup: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnSkip: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  btnSkipText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btnNav: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  btnNavText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

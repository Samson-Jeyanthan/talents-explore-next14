"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/moreDetailPostCarousel.css";
import {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType,
} from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import {
  // DotButton,
  useDotButton,
} from "./EmblaCarouselDotButton";
import Image from "next/image";
import { useUtils } from "@/context/UtilsProvider";
import { FullScreenIcon } from "@/public/assets/svgs";
import { Dialog } from "@/components/ui/dialog";
import { FullScreenModal } from "@/components/modals";

const TWEEN_FACTOR_BASE = 0.52;

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

type Props = {
  slides: [any];
  options?: EmblaOptionsType;
};

const MoreDetailPostCarousel = ({ slides, options }: Props) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { setmdSelectedMediaIndex } = useUtils();
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);

  const {
    selectedIndex,
    // scrollSnaps,
    // onDotButtonClick
  } = useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType): void => {
    tweenNodes.current = emblaApi.slideNodes().map((slideNode) => {
      return slideNode.querySelector(
        ".mdp-embla__slide__number"
      ) as HTMLElement;
    });
  }, []);

  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length;
  }, []);

  const tweenScale = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {
      const engine = emblaApi.internalEngine();
      const scrollProgress = emblaApi.scrollProgress();
      const slidesInView = emblaApi.slidesInView();
      const isScrollEvent = eventName === "scroll";

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress;
        const slidesInSnap = engine.slideRegistry[snapIndex];

        slidesInSnap.forEach((slideIndex) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target();

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target);

                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress);
                }
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress);
                }
              }
            });
          }

          const tweenValue = 1 - Math.abs(diffToTarget * 0.7);
          const scale = numberWithinRange(tweenValue, 0, 1).toString();
          // const scale = 0.5;
          const tweenNode = tweenNodes.current[slideIndex];
          tweenNode.style.transform = `scale(${scale})`;
        });
      });
    },
    []
  );

  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    emblaApi
      .on("reInit", setTweenNodes)
      .on("reInit", setTweenFactor)
      .on("reInit", tweenScale)
      .on("scroll", tweenScale)
      .on("slideFocus", tweenScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, tweenScale]);

  useEffect(() => {
    setmdSelectedMediaIndex(selectedIndex);
  }, [selectedIndex, setmdSelectedMediaIndex]);

  const handleFullScreen = () => {
    setIsFullScreen(true);
    const elem = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  const handleMinScreen = () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };

    if (doc.fullscreenElement) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        /* Safari */
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        /* IE11 */
        doc.msExitFullscreen();
      }
    }
    setIsFullScreen(false);
  };

  return (
    <>
      <div className="mdp-embla flex w-[86%] flex-col items-center justify-center">
        <div className="mdp-embla__viewport" ref={emblaRef}>
          <div className="mdp-embla__container">
            {slides.map((media, index) => (
              <div
                className={`${options?.loop ? "mdp-embla__slide" : "mdp-embla__slide__for__two"}`}
                key={index}
              >
                <div className="relative h-auto w-max">
                  {}
                  <Image
                    src={
                      media.mediaType === "image"
                        ? media.url
                        : "/assets/images/sample-post-img.jpg"
                    }
                    width={1024}
                    height={1024}
                    alt="media"
                    className="mdp-embla__slide__number h-[30rem] w-auto rounded-2xl bg-none object-contain"
                  />
                  {selectedIndex === index && (
                    <div
                      className="absolute bottom-3 right-3 grid size-[34px] cursor-pointer place-items-center rounded-full bg-dark-200 fill-light-900 pt-[2px]"
                      onClick={handleFullScreen}
                    >
                      <FullScreenIcon width={"17px"} height={"17px"} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mdp-embla__controls">
          <div className="text-sm text-light-500">
            {selectedIndex + 1} / {slides.length}
          </div>
          <div className="mdp-embla__buttons">
            <PrevButton
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
            />
            <NextButton
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
            />
          </div>
        </div>
      </div>
      <Dialog open={isFullScreen}>
        <FullScreenModal
          mediaType="image"
          mediaUrl={slides[selectedIndex]?.url}
          onClose={handleMinScreen}
        />
      </Dialog>
    </>
  );
};

export default MoreDetailPostCarousel;

// dot buttons design
/* <div className="embla__dots">
  {scrollSnaps.map((_, index) => (
    <DotButton
      key={index}
      onClick={() => onDotButtonClick(index)}
      className={"embla__dot".concat(
        index === selectedIndex ? " embla__dot--selected" : ""
      )}
    />
  ))}
</div>; */

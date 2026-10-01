import React, { useEffect, useRef, useState } from "react";
import { testimonialStyles } from "../assets/dummyStyles";
import { Star } from "lucide-react";

function Testimonial() {
    const leftContainerRef = useRef(null);
    const rightContainerRef = useRef(null);

    const leftTrackRef = useRef(null);
    const rightTrackRef = useRef(null);

    const leftAnimationRef = useRef(null);
    const rightAnimationRef = useRef(null);

    const leftPositionRef = useRef(0);
    const rightPositionRef = useRef(0);

    const lastTimeRef = useRef(null);

    const [isPaused, setIsPaused] = useState(false);

    const testimonials = [
        {
            id: 1,
            name: "Dr. Sarah Johnson",
            role: "Cardiologist",
            rating: 5,
            text: "The appointment booking system is incredibly efficient. It saves me valuable time and helps me focus on patient care.",
            image:
                "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
            type: "doctor",
        },
        {
            id: 2,
            name: "Michael Chen",
            role: "Patient",
            rating: 5,
            text: "Scheduling appointments has never been easier. The interface is intuitive and reminders are very helpful!",
            image:
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
            type: "patient",
        },
        {
            id: 3,
            name: "Dr. Robert Martinez",
            role: "Pediatrician",
            rating: 4,
            text: "This platform has streamlined our clinic operations significantly. Patient management is much more organized.",
            image:
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
            type: "doctor",
        },
        {
            id: 4,
            name: "Emily Williams",
            role: "Patient",
            rating: 5,
            text: "Booking appointments online 24/7 is a game-changer. The confirmation system gives me peace of mind.",
            image:
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
            type: "patient",
        },
        {
            id: 5,
            name: "Dr. Amanda Lee",
            role: "Dermatologist",
            rating: 5,
            text: "Excellent platform for managing appointments. Automated reminders reduce no-shows dramatically.",
            image:
                "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
            type: "doctor",
        },
        {
            id: 6,
            name: "David Thompson",
            role: "Patient",
            rating: 5,
            text: "The wait time has reduced significantly since using this platform. Very convenient and user-friendly!",
            image:
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
            type: "patient",
        },
    ];

    const leftTestimonials = testimonials.filter(
        (testimonial) => testimonial.type === "doctor"
    );

    const rightTestimonials = testimonials.filter(
        (testimonial) => testimonial.type === "patient"
    );

    /*
     * SMOOTH INFINITE ANIMATION
     */
    useEffect(() => {
        const leftTrack = leftTrackRef.current;
        const rightTrack = rightTrackRef.current;

        if (!leftTrack || !rightTrack) return;

        const speed = 25; // pixels per second

        let leftHalfHeight = 0;
        let rightHalfHeight = 0;

        const updateHeights = () => {
            leftHalfHeight = leftTrack.scrollHeight / 2;
            rightHalfHeight = rightTrack.scrollHeight / 2;
        };

        updateHeights();

        const resizeObserver = new ResizeObserver(() => {
            updateHeights();
        });

        resizeObserver.observe(leftTrack);
        resizeObserver.observe(rightTrack);

        const animate = (time) => {
            if (lastTimeRef.current === null) {
                lastTimeRef.current = time;
            }

            const deltaTime = Math.min(
                (time - lastTimeRef.current) / 1000,
                0.05
            );

            lastTimeRef.current = time;

            if (!isPaused) {
                /*
                 * LEFT
                 * Moves DOWN
                 */
                leftPositionRef.current += speed * deltaTime;

                if (leftPositionRef.current >= leftHalfHeight) {
                    leftPositionRef.current = 0;
                }

                leftTrack.style.transform = `translate3d(0, ${-leftHalfHeight + leftPositionRef.current}px, 0)`;

                /*
                 * RIGHT
                 * Moves UP
                 */
                rightPositionRef.current += speed * deltaTime;

                if (rightPositionRef.current >= rightHalfHeight) {
                    rightPositionRef.current = 0;
                }

                rightTrack.style.transform = `translate3d(0, ${-rightPositionRef.current}px, 0)`;
            }

            leftAnimationRef.current = requestAnimationFrame(animate);
        };

        leftAnimationRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(leftAnimationRef.current);
            cancelAnimationFrame(rightAnimationRef.current);

            resizeObserver.disconnect();

            lastTimeRef.current = null;
        };
    }, [isPaused]);

    /*
     * STAR RENDERER
     */
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={
                    index < rating
                        ? testimonialStyles.activeStar
                        : testimonialStyles.inactiveStar
                }
            >
                <Star className={testimonialStyles.star} />
            </span>
        ));
    };

    /*
     * TESTIMONIAL CARD
     */
    const TestimonialCard = ({ testimonial, direction }) => {
        const isLeft = direction === "left";

        return (
            <div
                className={`${testimonialStyles.testimonialCard} ${
                    isLeft
                        ? testimonialStyles.leftCardBorder
                        : testimonialStyles.rightCardBorder
                }`}
            >
                <div className={testimonialStyles.cardContent}>
                    <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className={testimonialStyles.avatar}
                    />

                    <div className={testimonialStyles.textContainer}>
                        <div
                            className={
                                testimonialStyles.nameRoleContainer
                            }
                        >
                            <div>
                                <h4
                                    className={`${testimonialStyles.name} ${
                                        isLeft
                                            ? testimonialStyles.leftName
                                            : testimonialStyles.rightName
                                    }`}
                                >
                                    {testimonial.name}
                                </h4>

                                <p className={testimonialStyles.role}>
                                    {testimonial.role}
                                </p>
                            </div>

                            <div
                                className={
                                    testimonialStyles.starsContainer
                                }
                            >
                                {renderStars(testimonial.rating)}
                            </div>
                        </div>

                        <p className={testimonialStyles.quote}>
                            "{testimonial.text}"
                        </p>

                        <div
                            className={
                                testimonialStyles.mobileStarsContainer
                            }
                        >
                            {renderStars(testimonial.rating)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={testimonialStyles.container}>
            {/* HEADER */}
            <div className={testimonialStyles.headerContainer}>
                <h2 className={testimonialStyles.title}>
                    Voices of Trust
                </h2>

                <p className={testimonialStyles.subtitle}>
                    Real stories from doctors and patients sharing
                    their positive experiences with our healthcare
                    platform.
                </p>
            </div>

            {/* TESTIMONIAL GRID */}
            <div
                className={testimonialStyles.grid}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* ================= DOCTORS ================= */}
                <div
                    className={`${testimonialStyles.columnContainer} ${testimonialStyles.leftColumnBorder}`}
                >
                    <div
                        className={`${testimonialStyles.columnHeader} ${testimonialStyles.leftColumnHeader}`}
                    >
                        👩‍⚕️ Medical Professionals
                    </div>

                    <div
                        ref={leftContainerRef}
                        className={testimonialStyles.scrollContainer}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                    >
                        <div
                            ref={leftTrackRef}
                            style={{
                                willChange: "transform",
                            }}
                        >
                            {/* FIRST COPY */}
                            {leftTestimonials.map((testimonial) => (
                                <TestimonialCard
                                    key={`left-first-${testimonial.id}`}
                                    testimonial={testimonial}
                                    direction="left"
                                />
                            ))}

                            {/* SECOND COPY */}
                            {leftTestimonials.map((testimonial) => (
                                <TestimonialCard
                                    key={`left-second-${testimonial.id}`}
                                    testimonial={testimonial}
                                    direction="left"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ================= PATIENTS ================= */}
                <div
                    className={`${testimonialStyles.columnContainer} ${testimonialStyles.rightColumnBorder}`}
                >
                    <div
                        className={`${testimonialStyles.columnHeader} ${testimonialStyles.rightColumnHeader}`}
                    >
                        👨‍⚕️ Patients
                    </div>

                    <div
                        ref={rightContainerRef}
                        className={testimonialStyles.scrollContainer}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                    >
                        <div
                            ref={rightTrackRef}
                            style={{
                                willChange: "transform",
                            }}
                        >
                            {/* FIRST COPY */}
                            {rightTestimonials.map((testimonial) => (
                                <TestimonialCard
                                    key={`right-first-${testimonial.id}`}
                                    testimonial={testimonial}
                                    direction="right"
                                />
                            ))}

                            {/* SECOND COPY */}
                            {rightTestimonials.map((testimonial) => (
                                <TestimonialCard
                                    key={`right-second-${testimonial.id}`}
                                    testimonial={testimonial}
                                    direction="right"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{testimonialStyles.animationStyles}</style>
        </div>
    );
}

export default Testimonial;
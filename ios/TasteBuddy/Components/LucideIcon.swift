import SwiftUI

enum TBIcon {
    enum Size {
        static let extraSmall: CGFloat = 12
        static let xSmall: CGFloat = extraSmall
        static let small: CGFloat = 14
        static let base: CGFloat = 16
        static let medium: CGFloat = 18
        static let control: CGFloat = 20
        static let large: CGFloat = 24
        static let extraLarge: CGFloat = 28
        static let touch: CGFloat = 24
        static let hero: CGFloat = 24
    }

    enum Stroke {
        static let thin: CGFloat = 1.5
        static let regular: CGFloat = 1.8
        static let medium: CGFloat = 2
        static let strong: CGFloat = 2.2
        static let emphasis: CGFloat = 3
    }

    enum Container {
        static let small: CGFloat = 18
        static let medium: CGFloat = 24
        static let large: CGFloat = 32
        static let extraLarge: CGFloat = 32
    }
}

enum LucideIconName: String, CaseIterable {
    case archive
    case arrowDownRight
    case arrowUpRight
    case beef
    case bell
    case bookmark
    case cakeSlice
    case calendarCheck
    case camera
    case chefHat
    case check
    case chevronDown
    case chevronLeft
    case chevronRight
    case chevronUp
    case circleArrowDown
    case circleCheck
    case circleDot
    case circleHelp
    case circlePlus
    case clock
    case coffee
    case cookingPot
    case copy
    case croissant
    case cupSoda
    case dessert
    case droplet
    case eggFried
    case ellipsis
    case eye
    case eyeOff
    case fish
    case globe
    case heart
    case image
    case info
    case leaf
    case link
    case logOut
    case mail
    case mapPin
    case menu
    case messageCircle
    case minus
    case pencil
    case phone
    case plus
    case refreshCw
    case search
    case send
    case settings
    case share
    case shieldCheck
    case salad
    case sandwich
    case soup
    case sparkles
    case squarePen
    case star
    case store
    case sun
    case switchCamera
    case trash2
    case trophy
    case utensils
    case utensilsCrossed
    case user
    case userLock
    case userPlus
    case waves
    case wine
    case x
    case zap
    case zapOff

    // Dish Icons (Lucide Style)
    case dishNoodle
    case dishDumpling
    case dishSauce
    case dishGrill
    case dishWok
    case dishCrispy
    case dishRaw
    case dishFerment
    case dishCheese
    case dishSpice
    case dishCold
    case dishTofu
    case dishRice

    init(systemName: String) {
        switch systemName {
        case "archivebox":
            self = .archive
        case "arrow.down.right", "arrow.down.right.circle.fill", "arrow.down.right.fill":
            self = .arrowDownRight
        case "arrow.up.right", "arrow.up.right.circle.fill", "arrow.up.right.fill":
            self = .arrowUpRight
        case "bell":
            self = .bell
        case "bookmark", "bookmark.fill":
            self = .bookmark
        case "calendar.badge.checkmark", "calendar.badge.checkmark.fill", "calendar.fill":
            self = .calendarCheck
        case "camera":
            self = .camera
        case "checkmark":
            self = .check
        case "checkmark.circle", "checkmark.circle.fill":
            self = .circleCheck
        case "arrow.down.circle", "arrow.down.circle.fill":
            self = .circleArrowDown
        case "chevron.down":
            self = .chevronDown
        case "chevron.left":
            self = .chevronLeft
        case "chevron.right":
            self = .chevronRight
        case "chevron.up":
            self = .chevronUp
        case "circle.grid.2x2.fill":
            self = .circleDot
        case "circle-help", "circleHelp", "questionmark.circle":
            self = .circleHelp
        case "clock":
            self = .clock
        case "doc.on.doc":
            self = .copy
        case "drop.fill":
            self = .droplet
        case "ellipsis":
            self = .ellipsis
        case "eye", "doc.text.magnifyingglass":
            self = .eye
        case "eye-off", "eyeOff", "eye.slash":
            self = .eyeOff
        case "globe", "globe.fill", "globe.americas.fill":
            self = .globe
        case "envelope":
            self = .mail
        case "fork.knife", "fork.knife.circle", "fork.knife.fill":
            self = .utensils
        case "utensils-crossed", "utensilsCrossed":
            self = .utensilsCrossed
        case "gearshape":
            self = .settings
        case "heart", "heart.fill":
            self = .heart
        case "info", "info.circle":
            self = .info
        case "image", "photo", "photo.on.rectangle":
            self = .image
        case "leaf.fill":
            self = .leaf
        case "link":
            self = .link
        case "line.3.horizontal":
            self = .menu
        case "magnifyingglass":
            self = .search
        case "mappin", "mappin.circle":
            self = .mapPin
        case "minus":
            self = .minus
        case "paperplane":
            self = .send
        case "pencil":
            self = .pencil
        case "phone":
            self = .phone
        case "person":
            self = .user
        case "user-lock", "userLock", "person.badge.key":
            self = .userLock
        case "person.badge.plus":
            self = .userPlus
        case "plus":
            self = .plus
        case "plus.circle":
            self = .circlePlus
        case "arrow.clockwise", "refresh-cw", "refreshCw":
            self = .refreshCw
        case "rectangle.portrait.and.arrow.right":
            self = .logOut
        case "shield.checkered":
            self = .shieldCheck
        case "sparkles", "sparkles.fill":
            self = .sparkles
        case "square.and.arrow.up":
            self = .share
        case "square-pen", "squarePen", "square.and.pencil":
            self = .squarePen
        case "star", "star.fill":
            self = .star
        case "storefront", "storefront.fill":
            self = .store
        case "sun.max.fill":
            self = .sun
        case "switch-camera", "switchCamera", "camera.rotate":
            self = .switchCamera
        case "text.bubble":
            self = .messageCircle
        case "trash", "trash.fill":
            self = .trash2
        case "trophy":
            self = .trophy
        case "water.waves":
            self = .waves
        case "xmark", "x":
            self = .x
        case "zap", "bolt":
            self = .zap
        case "zap-off", "zapOff", "bolt.slash":
            self = .zapOff

        // Dish Symbols (Lucide Style)
        case "dish.seafood", "seafood", "해산물":
            self = .fish
        case "dish.meat", "meat", "육류":
            self = .beef
        case "dish.vegetable", "vegetable", "vegetable_herb", "채소":
            self = .salad
        case "dish.tofu", "tofu", "legume_tofu", "두부":
            self = .dishTofu
        case "dish.noodle", "noodle", "grain_noodle", "면":
            self = .dishNoodle
        case "dish.dumpling", "dumpling", "dumpling_batter", "만두":
            self = .dishDumpling
        case "dish.broth", "dish.soup", "broth", "soup", "국물", "국·탕":
            self = .soup
        case "dish.sauce", "sauce", "sauce_glaze", "소스":
            self = .dishSauce
        case "dish.grill", "grill", "grilled_smoked", "구이":
            self = .dishGrill
        case "dish.wok", "wok", "stir_fried_wok", "볶음":
            self = .dishWok
        case "dish.crispy", "crispy", "fried_crispy", "튀김":
            self = .dishCrispy
        case "dish.steam", "steam", "steamed_braised", "찜·조림":
            self = .cookingPot
        case "dish.raw", "raw", "raw_cured", "회·생요리":
            self = .dishRaw
        case "dish.ferment", "ferment", "fermented_jang", "발효음식":
            self = .dishFerment
        case "dish.cheese", "cheese", "dairy_cheese", "치즈":
            self = .dishCheese
        case "dish.spice", "spice", "spice_heat", "향신료 음식":
            self = .dishSpice
        case "dish.cold", "cold", "차가운 요리":
            self = .dishCold
        case "dish.dessert", "dessert", "디저트":
            self = .cakeSlice
        case "dish.beverage", "beverage", "beverage_pairing", "음료":
            self = .wine
        case "dish.rice", "rice", "밥":
            self = .dishRice

        default:
            self = .circleDot
        }
    }
}

struct LucideIcon: View {
    let name: LucideIconName
    var size: CGFloat = TBIcon.Size.large
    var strokeWidth: CGFloat = TBIcon.Stroke.regular
    var filled = false

    init(
        _ name: LucideIconName,
        size: CGFloat = TBIcon.Size.large,
        strokeWidth: CGFloat = TBIcon.Stroke.regular,
        filled: Bool = false
    ) {
        self.name = name
        self.size = size
        self.strokeWidth = strokeWidth
        self.filled = filled
    }

    init(
        systemName: String,
        size: CGFloat = TBIcon.Size.large,
        strokeWidth: CGFloat = TBIcon.Stroke.regular,
        filled: Bool? = nil
    ) {
        self.init(
            LucideIconName(systemName: systemName),
            size: size,
            strokeWidth: strokeWidth,
            filled: filled ?? systemName.hasSuffix(".fill")
        )
    }

    var body: some View {
        Canvas(opaque: false, colorMode: .nonLinear, rendersAsynchronously: false) { context, canvasSize in
            let scale = min(canvasSize.width, canvasSize.height) / 24
            let offset = CGPoint(
                x: (canvasSize.width - 24 * scale) / 2,
                y: (canvasSize.height - 24 * scale) / 2
            )

            context.translateBy(x: offset.x, y: offset.y)
            context.scaleBy(x: scale, y: scale)
            draw(name, in: &context)
        }
        .frame(width: size, height: size)
    }

    private func draw(_ name: LucideIconName, in context: inout GraphicsContext) {
        let stroke = StrokeStyle(
            lineWidth: strokeWidth,
            lineCap: .round,
            lineJoin: .round
        )

        func strokePath(_ path: Path) {
            context.stroke(path, with: .foreground, style: stroke)
        }

        func fillThenStroke(_ path: Path) {
            if filled {
                context.fill(path, with: .foreground)
            }
            context.stroke(path, with: .foreground, style: stroke)
        }

        func line(_ x1: CGFloat, _ y1: CGFloat, _ x2: CGFloat, _ y2: CGFloat) {
            var path = Path()
            path.move(to: CGPoint(x: x1, y: y1))
            path.addLine(to: CGPoint(x: x2, y: y2))
            strokePath(path)
        }

        func circle(_ x: CGFloat, _ y: CGFloat, _ radius: CGFloat) {
            strokePath(Path(ellipseIn: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)))
        }

        func filledCircle(_ x: CGFloat, _ y: CGFloat, _ radius: CGFloat) {
            let path = Path(ellipseIn: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2))
            context.fill(path, with: .foreground)
            context.stroke(path, with: .foreground, style: stroke)
        }

        func rect(_ x: CGFloat, _ y: CGFloat, _ width: CGFloat, _ height: CGFloat, _ radius: CGFloat) {
            strokePath(Path(roundedRect: CGRect(x: x, y: y, width: width, height: height), cornerRadius: radius))
        }

        func polyline(_ points: [CGPoint], closed: Bool = false, fill: Bool = false) {
            var path = Path()
            guard let first = points.first else { return }
            path.move(to: first)
            points.dropFirst().forEach { path.addLine(to: $0) }
            if closed {
                path.closeSubpath()
            }
            if fill || filled {
                fillThenStroke(path)
            } else {
                strokePath(path)
            }
        }

        func addArcSegment(
            to path: inout Path,
            center: CGPoint,
            radius: CGFloat,
            startAngle: CGFloat,
            endAngle: CGFloat
        ) {
            let maxSegment = CGFloat.pi / 2
            let delta = endAngle - startAngle
            let segmentCount = max(1, Int(ceil(abs(delta) / maxSegment)))
            let segmentAngle = delta / CGFloat(segmentCount)

            for index in 0..<segmentCount {
                let start = startAngle + CGFloat(index) * segmentAngle
                let end = start + segmentAngle
                let controlScale = CGFloat(4.0 / 3.0) * tan(segmentAngle / 4)

                let startPoint = CGPoint(
                    x: center.x + radius * cos(start),
                    y: center.y + radius * sin(start)
                )
                let endPoint = CGPoint(
                    x: center.x + radius * cos(end),
                    y: center.y + radius * sin(end)
                )
                let startDerivative = CGPoint(
                    x: -radius * sin(start),
                    y: radius * cos(start)
                )
                let endDerivative = CGPoint(
                    x: -radius * sin(end),
                    y: radius * cos(end)
                )

                path.addCurve(
                    to: endPoint,
                    control1: CGPoint(
                        x: startPoint.x + controlScale * startDerivative.x,
                        y: startPoint.y + controlScale * startDerivative.y
                    ),
                    control2: CGPoint(
                        x: endPoint.x - controlScale * endDerivative.x,
                        y: endPoint.y - controlScale * endDerivative.y
                    )
                )
            }
        }

        func arcDelta(from start: CGFloat, to end: CGFloat, sweep: Bool) -> CGFloat {
            let twoPi = CGFloat.pi * 2
            var delta = end - start
            if sweep {
                while delta < 0 { delta += twoPi }
                while delta >= twoPi { delta -= twoPi }
            } else {
                while delta > 0 { delta -= twoPi }
                while delta <= -twoPi { delta += twoPi }
            }
            return delta
        }

        func addSvgArc(
            to path: inout Path,
            from startPoint: CGPoint,
            to endPoint: CGPoint,
            radius: CGFloat,
            largeArc: Bool,
            sweep: Bool
        ) {
            let dx = endPoint.x - startPoint.x
            let dy = endPoint.y - startPoint.y
            let distance = sqrt(dx * dx + dy * dy)
            guard distance > 0 else { return }

            let adjustedRadius = max(radius, distance / 2)
            let midpoint = CGPoint(
                x: (startPoint.x + endPoint.x) / 2,
                y: (startPoint.y + endPoint.y) / 2
            )
            let halfChord = distance / 2
            let centerOffset = sqrt(max(0, adjustedRadius * adjustedRadius - halfChord * halfChord))
            let perpendicular = CGPoint(x: -dy / distance, y: dx / distance)
            let centers = [
                CGPoint(
                    x: midpoint.x + perpendicular.x * centerOffset,
                    y: midpoint.y + perpendicular.y * centerOffset
                ),
                CGPoint(
                    x: midpoint.x - perpendicular.x * centerOffset,
                    y: midpoint.y - perpendicular.y * centerOffset
                ),
            ]

            let selected = centers.first { center in
                let start = atan2(startPoint.y - center.y, startPoint.x - center.x)
                let end = atan2(endPoint.y - center.y, endPoint.x - center.x)
                let delta = arcDelta(from: start, to: end, sweep: sweep)
                return (abs(delta) > CGFloat.pi) == largeArc
            } ?? centers[0]

            let start = atan2(startPoint.y - selected.y, startPoint.x - selected.x)
            let end = atan2(endPoint.y - selected.y, endPoint.x - selected.x)
            let delta = arcDelta(from: start, to: end, sweep: sweep)
            addArcSegment(
                to: &path,
                center: selected,
                radius: adjustedRadius,
                startAngle: start,
                endAngle: start + delta
            )
        }

        switch name {
        case .archive:
            rect(2, 3, 20, 5, 1)
            var box = Path()
            box.move(to: CGPoint(x: 4, y: 8))
            box.addLine(to: CGPoint(x: 4, y: 19))
            box.addQuadCurve(to: CGPoint(x: 6, y: 21), control: CGPoint(x: 4, y: 20.1))
            box.addLine(to: CGPoint(x: 18, y: 21))
            box.addQuadCurve(to: CGPoint(x: 20, y: 19), control: CGPoint(x: 20, y: 20.1))
            box.addLine(to: CGPoint(x: 20, y: 8))
            strokePath(box)
            line(10, 12, 14, 12)
        case .arrowDownRight:
            if filled {
                filledCircle(12, 12, 10)
                var path = Path()
                path.move(to: CGPoint(x: 15, y: 9))
                path.addLine(to: CGPoint(x: 15, y: 15))
                path.addLine(to: CGPoint(x: 9, y: 15))
                context.stroke(path, with: .color(.white), style: stroke)
                var diag = Path()
                diag.move(to: CGPoint(x: 9, y: 9))
                diag.addLine(to: CGPoint(x: 15, y: 15))
                context.stroke(diag, with: .color(.white), style: stroke)
            } else {
                line(7, 7, 17, 17)
                polyline([CGPoint(x: 17, y: 7), CGPoint(x: 17, y: 17), CGPoint(x: 7, y: 17)])
            }
        case .arrowUpRight:
            if filled {
                filledCircle(12, 12, 10)
                var path = Path()
                path.move(to: CGPoint(x: 9, y: 9))
                path.addLine(to: CGPoint(x: 15, y: 9))
                path.addLine(to: CGPoint(x: 15, y: 15))
                context.stroke(path, with: .color(.white), style: stroke)
                var diag = Path()
                diag.move(to: CGPoint(x: 9, y: 15))
                diag.addLine(to: CGPoint(x: 15, y: 9))
                context.stroke(diag, with: .color(.white), style: stroke)
            } else {
                polyline([CGPoint(x: 7, y: 7), CGPoint(x: 17, y: 7), CGPoint(x: 17, y: 17)])
                line(7, 17, 17, 7)
            }
        case .beef:
            var steak = Path()
            steak.move(to: CGPoint(x: 16.4, y: 13.7))
            steak.addCurve(
                to: CGPoint(x: 6.28, y: 6.6),
                control1: CGPoint(x: 14.8, y: 3.5),
                control2: CGPoint(x: 8.2, y: 1.8)
            )
            steak.addCurve(
                to: CGPoint(x: 3.1, y: 12.68),
                control1: CGPoint(x: 5.18, y: 9.73),
                control2: CGPoint(x: 5.5, y: 10.5)
            )
            steak.addCurve(
                to: CGPoint(x: 5, y: 18),
                control1: CGPoint(x: 0.8, y: 14.8),
                control2: CGPoint(x: 1.9, y: 18)
            )
            steak.addCurve(
                to: CGPoint(x: 16.4, y: 13.7),
                control1: CGPoint(x: 9, y: 18),
                control2: CGPoint(x: 13.4, y: 16.2)
            )
            strokePath(steak)

            var outer = Path()
            outer.move(to: CGPoint(x: 18.5, y: 6))
            outer.addLine(to: CGPoint(x: 20.69, y: 10.5))
            outer.addCurve(
                to: CGPoint(x: 18.4, y: 17.7),
                control1: CGPoint(x: 22, y: 13.2),
                control2: CGPoint(x: 21.1, y: 16)
            )
            outer.addCurve(
                to: CGPoint(x: 7, y: 22),
                control1: CGPoint(x: 15.4, y: 20.2),
                control2: CGPoint(x: 11, y: 22)
            )
            outer.addCurve(
                to: CGPoint(x: 4.32, y: 20.34),
                control1: CGPoint(x: 5.85, y: 22),
                control2: CGPoint(x: 4.83, y: 21.36)
            )
            outer.addLine(to: CGPoint(x: 2.4, y: 16.5))
            strokePath(outer)
            circle(12.5, 8.5, 2.5)
        case .cakeSlice:
            circle(9, 7, 2)
            var cake = Path()
            cake.move(to: CGPoint(x: 7.2, y: 7.9))
            cake.addLine(to: CGPoint(x: 3, y: 11))
            cake.addLine(to: CGPoint(x: 3, y: 20))
            cake.addQuadCurve(to: CGPoint(x: 4, y: 21), control: CGPoint(x: 3, y: 21))
            cake.addLine(to: CGPoint(x: 20, y: 21))
            cake.addQuadCurve(to: CGPoint(x: 21, y: 20), control: CGPoint(x: 21, y: 21))
            cake.addLine(to: CGPoint(x: 21, y: 11))
            cake.addCurve(
                to: CGPoint(x: 14, y: 3),
                control1: CGPoint(x: 21, y: 9),
                control2: CGPoint(x: 18, y: 5)
            )
            cake.addLine(to: CGPoint(x: 10.4, y: 5.6))
            strokePath(cake)
            line(16, 13, 3, 13)
            line(16, 17, 3, 17)
        case .coffee:
            line(10, 2, 10, 4)
            line(14, 2, 14, 4)
            line(6, 2, 6, 4)
            var cup = Path()
            cup.move(to: CGPoint(x: 4, y: 8))
            cup.addQuadCurve(to: CGPoint(x: 3, y: 9), control: CGPoint(x: 3, y: 8))
            cup.addLine(to: CGPoint(x: 3, y: 17))
            cup.addCurve(
                to: CGPoint(x: 7, y: 21),
                control1: CGPoint(x: 3, y: 19.2),
                control2: CGPoint(x: 4.8, y: 21)
            )
            cup.addLine(to: CGPoint(x: 13, y: 21))
            cup.addCurve(
                to: CGPoint(x: 17, y: 17),
                control1: CGPoint(x: 15.2, y: 21),
                control2: CGPoint(x: 17, y: 19.2)
            )
            cup.addLine(to: CGPoint(x: 17, y: 9))
            cup.addQuadCurve(to: CGPoint(x: 16, y: 8), control: CGPoint(x: 17, y: 8))
            cup.closeSubpath()
            strokePath(cup)

            var handle = Path()
            handle.move(to: CGPoint(x: 17, y: 8))
            handle.addLine(to: CGPoint(x: 18, y: 8))
            handle.addCurve(
                to: CGPoint(x: 18, y: 16),
                control1: CGPoint(x: 23.33, y: 8),
                control2: CGPoint(x: 23.33, y: 16)
            )
            handle.addLine(to: CGPoint(x: 17, y: 16))
            strokePath(handle)
        case .cookingPot:
            line(2, 12, 22, 12)
            var pot = Path()
            pot.move(to: CGPoint(x: 20, y: 12))
            pot.addLine(to: CGPoint(x: 20, y: 20))
            pot.addQuadCurve(to: CGPoint(x: 18, y: 22), control: CGPoint(x: 20, y: 22))
            pot.addLine(to: CGPoint(x: 6, y: 22))
            pot.addQuadCurve(to: CGPoint(x: 4, y: 20), control: CGPoint(x: 4, y: 22))
            pot.addLine(to: CGPoint(x: 4, y: 12))
            strokePath(pot)
            line(4, 8, 20, 4)
            var handle = Path()
            handle.move(to: CGPoint(x: 8.86, y: 6.78))
            handle.addLine(to: CGPoint(x: 8.41, y: 4.97))
            handle.addCurve(
                to: CGPoint(x: 9.86, y: 2.54),
                control1: CGPoint(x: 8.14, y: 3.9),
                control2: CGPoint(x: 8.79, y: 2.81)
            )
            handle.addLine(to: CGPoint(x: 11.8, y: 2.06))
            handle.addCurve(
                to: CGPoint(x: 14.23, y: 3.52),
                control1: CGPoint(x: 12.87, y: 1.79),
                control2: CGPoint(x: 13.96, y: 2.45)
            )
            handle.addLine(to: CGPoint(x: 14.68, y: 5.32))
            strokePath(handle)
        case .croissant:
            var pastry = Path()
            pastry.move(to: CGPoint(x: 4.6, y: 13.11))
            pastry.addLine(to: CGPoint(x: 10.39, y: 9.9))
            pastry.addCurve(
                to: CGPoint(x: 14.1, y: 13.61),
                control1: CGPoint(x: 12.28, y: 8.85),
                control2: CGPoint(x: 15.18, y: 11.68)
            )
            pastry.addLine(to: CGPoint(x: 10.88, y: 19.42))
            pastry.addCurve(
                to: CGPoint(x: 4.6, y: 13.11),
                control1: CGPoint(x: 8.8, y: 23.16),
                control2: CGPoint(x: 0.79, y: 15.23)
            )
            pastry.closeSubpath()
            strokePath(pastry)

            var upper = Path()
            upper.move(to: CGPoint(x: 10.5, y: 9.5))
            upper.addLine(to: CGPoint(x: 9.5, y: 7.21))
            upper.addCurve(
                to: CGPoint(x: 8, y: 6),
                control1: CGPoint(x: 9.2, y: 6.48),
                control2: CGPoint(x: 8.8, y: 6)
            )
            upper.addLine(to: CGPoint(x: 4.5, y: 6))
            upper.addCurve(
                to: CGPoint(x: 2, y: 8.5),
                control1: CGPoint(x: 2.79, y: 6),
                control2: CGPoint(x: 2, y: 6.5)
            )
            upper.addCurve(
                to: CGPoint(x: 4, y: 13.33),
                control1: CGPoint(x: 2, y: 10.3),
                control2: CGPoint(x: 2.64, y: 11.86)
            )
            strokePath(upper)

            var upperTip = Path()
            upperTip.move(to: CGPoint(x: 8, y: 6))
            upperTip.addCurve(
                to: CGPoint(x: 6, y: 2),
                control1: CGPoint(x: 8, y: 4.45),
                control2: CGPoint(x: 8.24, y: 2)
            )
            upperTip.addCurve(
                to: CGPoint(x: 3.5, y: 6),
                control1: CGPoint(x: 4, y: 2),
                control2: CGPoint(x: 3.5, y: 4.17)
            )
            strokePath(upperTip)

            var lower = Path()
            lower.move(to: CGPoint(x: 14.5, y: 13.5))
            lower.addLine(to: CGPoint(x: 16.79, y: 14.5))
            lower.addCurve(
                to: CGPoint(x: 18, y: 16),
                control1: CGPoint(x: 17.52, y: 14.8),
                control2: CGPoint(x: 18, y: 15.2)
            )
            lower.addLine(to: CGPoint(x: 18, y: 19.5))
            lower.addCurve(
                to: CGPoint(x: 15.5, y: 22),
                control1: CGPoint(x: 18, y: 21.21),
                control2: CGPoint(x: 17.5, y: 22)
            )
            lower.addCurve(
                to: CGPoint(x: 10.67, y: 20),
                control1: CGPoint(x: 13.7, y: 22),
                control2: CGPoint(x: 12.14, y: 21.36)
            )
            strokePath(lower)

            var lowerTip = Path()
            lowerTip.move(to: CGPoint(x: 18, y: 16))
            lowerTip.addCurve(
                to: CGPoint(x: 22, y: 18),
                control1: CGPoint(x: 19.55, y: 16),
                control2: CGPoint(x: 22, y: 15.76)
            )
            lowerTip.addCurve(
                to: CGPoint(x: 18, y: 20.5),
                control1: CGPoint(x: 22, y: 20),
                control2: CGPoint(x: 19.83, y: 20.5)
            )
            strokePath(lowerTip)
        case .cupSoda:
            var cup = Path()
            cup.move(to: CGPoint(x: 6, y: 8))
            cup.addLine(to: CGPoint(x: 7.75, y: 20.28))
            cup.addCurve(
                to: CGPoint(x: 9.75, y: 22),
                control1: CGPoint(x: 7.89, y: 21.27),
                control2: CGPoint(x: 8.73, y: 22)
            )
            cup.addLine(to: CGPoint(x: 14.29, y: 22))
            cup.addCurve(
                to: CGPoint(x: 16.29, y: 20.28),
                control1: CGPoint(x: 15.31, y: 22),
                control2: CGPoint(x: 16.15, y: 21.27)
            )
            cup.addLine(to: CGPoint(x: 18, y: 8))
            strokePath(cup)
            line(5, 8, 19, 8)
            var drink = Path()
            drink.move(to: CGPoint(x: 7, y: 15))
            drink.addCurve(
                to: CGPoint(x: 12, y: 15),
                control1: CGPoint(x: 8.6, y: 14.25),
                control2: CGPoint(x: 10.4, y: 14.25)
            )
            drink.addCurve(
                to: CGPoint(x: 17, y: 15),
                control1: CGPoint(x: 13.6, y: 15.75),
                control2: CGPoint(x: 15.4, y: 15.75)
            )
            strokePath(drink)
            polyline([CGPoint(x: 12, y: 8), CGPoint(x: 13, y: 2), CGPoint(x: 15, y: 2)])
        case .dessert:
            circle(12, 4, 2)
            var dessert = Path()
            dessert.move(to: CGPoint(x: 10.2, y: 3.2))
            dessert.addCurve(
                to: CGPoint(x: 2, y: 13),
                control1: CGPoint(x: 5.5, y: 4),
                control2: CGPoint(x: 2, y: 8.1)
            )
            dessert.addCurve(
                to: CGPoint(x: 6, y: 13),
                control1: CGPoint(x: 2, y: 15.67),
                control2: CGPoint(x: 6, y: 15.67)
            )
            dessert.addLine(to: CGPoint(x: 6, y: 12))
            dessert.addCurve(
                to: CGPoint(x: 10, y: 12),
                control1: CGPoint(x: 6, y: 9.33),
                control2: CGPoint(x: 10, y: 9.33)
            )
            dessert.addLine(to: CGPoint(x: 10, y: 16))
            dessert.addCurve(
                to: CGPoint(x: 14, y: 16),
                control1: CGPoint(x: 10, y: 18.67),
                control2: CGPoint(x: 14, y: 18.67)
            )
            dessert.addLine(to: CGPoint(x: 14, y: 12))
            dessert.addCurve(
                to: CGPoint(x: 18, y: 12),
                control1: CGPoint(x: 14, y: 9.33),
                control2: CGPoint(x: 18, y: 9.33)
            )
            dessert.addLine(to: CGPoint(x: 18, y: 13))
            dessert.addCurve(
                to: CGPoint(x: 22, y: 13),
                control1: CGPoint(x: 18, y: 15.67),
                control2: CGPoint(x: 22, y: 15.67)
            )
            dessert.addCurve(
                to: CGPoint(x: 13.8, y: 3.2),
                control1: CGPoint(x: 22, y: 8.1),
                control2: CGPoint(x: 18.5, y: 4)
            )
            strokePath(dessert)

            var base = Path()
            base.move(to: CGPoint(x: 3.2, y: 14.8))
            base.addCurve(
                to: CGPoint(x: 20.8, y: 14.8),
                control1: CGPoint(x: 5, y: 24.4),
                control2: CGPoint(x: 19, y: 24.4)
            )
            strokePath(base)
        case .eggFried:
            circle(11.5, 12.5, 3.5)
            var egg = Path()
            egg.move(to: CGPoint(x: 3, y: 8))
            egg.addCurve(
                to: CGPoint(x: 9.5, y: 2),
                control1: CGPoint(x: 3, y: 4.5),
                control2: CGPoint(x: 5.5, y: 2)
            )
            egg.addCurve(
                to: CGPoint(x: 17, y: 7),
                control1: CGPoint(x: 14.5, y: 2),
                control2: CGPoint(x: 14.33, y: 5)
            )
            egg.addCurve(
                to: CGPoint(x: 22, y: 13),
                control1: CGPoint(x: 19.67, y: 9),
                control2: CGPoint(x: 22, y: 9)
            )
            egg.addCurve(
                to: CGPoint(x: 15, y: 19.5),
                control1: CGPoint(x: 22, y: 17.5),
                control2: CGPoint(x: 19.5, y: 19.5)
            )
            egg.addCurve(
                to: CGPoint(x: 9, y: 22),
                control1: CGPoint(x: 12.5, y: 19.5),
                control2: CGPoint(x: 12.5, y: 22)
            )
            egg.addCurve(
                to: CGPoint(x: 2, y: 16.5),
                control1: CGPoint(x: 5.5, y: 22),
                control2: CGPoint(x: 2, y: 20)
            )
            egg.addCurve(
                to: CGPoint(x: 3.5, y: 11.5),
                control1: CGPoint(x: 2, y: 13.5),
                control2: CGPoint(x: 3.5, y: 13.5)
            )
            egg.addCurve(
                to: CGPoint(x: 3, y: 8),
                control1: CGPoint(x: 3.5, y: 10),
                control2: CGPoint(x: 3, y: 9)
            )
            egg.closeSubpath()
            strokePath(egg)
        case .fish:
            var body = Path()
            body.move(to: CGPoint(x: 6.5, y: 12))
            body.addCurve(
                to: CGPoint(x: 15, y: 6),
                control1: CGPoint(x: 7.44, y: 8.54),
                control2: CGPoint(x: 11.44, y: 6)
            )
            body.addCurve(
                to: CGPoint(x: 22, y: 12),
                control1: CGPoint(x: 18.56, y: 6),
                control2: CGPoint(x: 21.06, y: 8.54)
            )
            body.addCurve(
                to: CGPoint(x: 15, y: 18),
                control1: CGPoint(x: 21.06, y: 15.47),
                control2: CGPoint(x: 18.56, y: 18)
            )
            body.addCurve(
                to: CGPoint(x: 6.5, y: 12),
                control1: CGPoint(x: 11.44, y: 18),
                control2: CGPoint(x: 7.44, y: 15.47)
            )
            body.closeSubpath()
            strokePath(body)
            line(18, 12, 18, 12.5)

            var gill = Path()
            gill.move(to: CGPoint(x: 16, y: 17.93))
            gill.addCurve(
                to: CGPoint(x: 16, y: 6.07),
                control1: CGPoint(x: 13.7, y: 14.5),
                control2: CGPoint(x: 13.7, y: 9.5)
            )
            strokePath(gill)

            var tail = Path()
            tail.move(to: CGPoint(x: 7, y: 10.67))
            tail.addCurve(
                to: CGPoint(x: 2.73, y: 5.5),
                control1: CGPoint(x: 7, y: 8),
                control2: CGPoint(x: 5.58, y: 5.97)
            )
            tail.addCurve(
                to: CGPoint(x: 2.96, y: 12),
                control1: CGPoint(x: 1.73, y: 7),
                control2: CGPoint(x: 1.73, y: 10.5)
            )
            tail.addCurve(
                to: CGPoint(x: 2.73, y: 18.5),
                control1: CGPoint(x: 1.72, y: 13.5),
                control2: CGPoint(x: 1.72, y: 17)
            )
            tail.addCurve(
                to: CGPoint(x: 7, y: 13.33),
                control1: CGPoint(x: 5.58, y: 18.03),
                control2: CGPoint(x: 7, y: 16)
            )
            strokePath(tail)

            var topFin = Path()
            topFin.move(to: CGPoint(x: 10.46, y: 7.26))
            topFin.addCurve(
                to: CGPoint(x: 8, y: 3),
                control1: CGPoint(x: 10.2, y: 5.88),
                control2: CGPoint(x: 9.17, y: 4.24)
            )
            topFin.addLine(to: CGPoint(x: 13.8, y: 3))
            topFin.addCurve(
                to: CGPoint(x: 15.78, y: 4.67),
                control1: CGPoint(x: 14.78, y: 3),
                control2: CGPoint(x: 15.62, y: 3.7)
            )
            topFin.addLine(to: CGPoint(x: 16.01, y: 6.07))
            strokePath(topFin)

            var lowerFin = Path()
            lowerFin.move(to: CGPoint(x: 16.01, y: 17.93))
            lowerFin.addLine(to: CGPoint(x: 15.78, y: 19.33))
            lowerFin.addCurve(
                to: CGPoint(x: 13.8, y: 21),
                control1: CGPoint(x: 15.62, y: 20.3),
                control2: CGPoint(x: 14.78, y: 21)
            )
            lowerFin.addLine(to: CGPoint(x: 9.5, y: 21))
            lowerFin.addCurve(
                to: CGPoint(x: 10.99, y: 17.02),
                control1: CGPoint(x: 10.55, y: 19.9),
                control2: CGPoint(x: 11.1, y: 18.5)
            )
            strokePath(lowerFin)
        case .salad:
            line(7, 21, 17, 21)
            var bowl = Path()
            bowl.move(to: CGPoint(x: 3, y: 12))
            bowl.addCurve(
                to: CGPoint(x: 12, y: 21),
                control1: CGPoint(x: 3, y: 16.97),
                control2: CGPoint(x: 7.03, y: 21)
            )
            bowl.addCurve(
                to: CGPoint(x: 21, y: 12),
                control1: CGPoint(x: 16.97, y: 21),
                control2: CGPoint(x: 21, y: 16.97)
            )
            bowl.closeSubpath()
            strokePath(bowl)

            var greens = Path()
            greens.move(to: CGPoint(x: 11.38, y: 12))
            greens.addCurve(
                to: CGPoint(x: 10.98, y: 7.23),
                control1: CGPoint(x: 8.35, y: 12),
                control2: CGPoint(x: 8.12, y: 7.69)
            )
            greens.addCurve(
                to: CGPoint(x: 14.18, y: 4.46),
                control1: CGPoint(x: 10.5, y: 4.8),
                control2: CGPoint(x: 12.9, y: 3.4)
            )
            greens.addCurve(
                to: CGPoint(x: 17.65, y: 3.83),
                control1: CGPoint(x: 15.15, y: 2.55),
                control2: CGPoint(x: 17.42, y: 2.65)
            )
            greens.addCurve(
                to: CGPoint(x: 21.02, y: 7.2),
                control1: CGPoint(x: 20.1, y: 2.1),
                control2: CGPoint(x: 22.7, y: 4.7)
            )
            greens.addCurve(
                to: CGPoint(x: 19.92, y: 10.9),
                control1: CGPoint(x: 22.3, y: 9),
                control2: CGPoint(x: 21.2, y: 10.6)
            )
            greens.addCurve(
                to: CGPoint(x: 19.95, y: 12),
                control1: CGPoint(x: 20.05, y: 11.3),
                control2: CGPoint(x: 20.05, y: 11.7)
            )
            strokePath(greens)
            line(13, 12, 17, 8)

            var leaf = Path()
            leaf.move(to: CGPoint(x: 10.9, y: 7.25))
            leaf.addCurve(
                to: CGPoint(x: 4, y: 10),
                control1: CGPoint(x: 8.4, y: 4),
                control2: CGPoint(x: 4, y: 5.8)
            )
            leaf.addCurve(
                to: CGPoint(x: 4.54, y: 12),
                control1: CGPoint(x: 4, y: 10.73),
                control2: CGPoint(x: 4.2, y: 11.41)
            )
            strokePath(leaf)
        case .sandwich:
            polyline([
                CGPoint(x: 2.37, y: 11.223),
                CGPoint(x: 10.742, y: 4.446),
                CGPoint(x: 12, y: 4),
                CGPoint(x: 13.258, y: 4.446),
                CGPoint(x: 21.629, y: 11.223)
            ])
            var right = Path()
            right.move(to: CGPoint(x: 21, y: 15))
            right.addQuadCurve(to: CGPoint(x: 22, y: 16), control: CGPoint(x: 22, y: 15))
            right.addLine(to: CGPoint(x: 22, y: 18))
            right.addQuadCurve(to: CGPoint(x: 21, y: 19), control: CGPoint(x: 22, y: 19))
            right.addLine(to: CGPoint(x: 15.75, y: 19))
            strokePath(right)

            var left = Path()
            left.move(to: CGPoint(x: 3, y: 15))
            left.addQuadCurve(to: CGPoint(x: 2, y: 16), control: CGPoint(x: 2, y: 15))
            left.addLine(to: CGPoint(x: 2, y: 18))
            left.addQuadCurve(to: CGPoint(x: 3, y: 19), control: CGPoint(x: 2, y: 19))
            left.addLine(to: CGPoint(x: 12, y: 19))
            strokePath(left)
            var filling = Path()
            filling.move(to: CGPoint(x: 6.67, y: 15))
            filling.addLine(to: CGPoint(x: 12.8, y: 19.6))
            filling.addCurve(
                to: CGPoint(x: 15.6, y: 19.2),
                control1: CGPoint(x: 13.68, y: 20.26),
                control2: CGPoint(x: 14.93, y: 20.08)
            )
            filling.addLine(to: CGPoint(x: 18.75, y: 15))
            strokePath(filling)
            rect(2, 11, 20, 4, 1)
        case .soup:
            var bowl = Path()
            bowl.move(to: CGPoint(x: 3, y: 12))
            bowl.addCurve(
                to: CGPoint(x: 12, y: 21),
                control1: CGPoint(x: 3, y: 16.97),
                control2: CGPoint(x: 7.03, y: 21)
            )
            bowl.addCurve(
                to: CGPoint(x: 21, y: 12),
                control1: CGPoint(x: 16.97, y: 21),
                control2: CGPoint(x: 21, y: 16.97)
            )
            bowl.closeSubpath()
            strokePath(bowl)
            line(7, 21, 17, 21)
            line(19.5, 12, 22, 6)

            for x in [6.25, 11.25, 16.25] {
                var steam = Path()
                steam.move(to: CGPoint(x: x, y: 3))
                steam.addCurve(
                    to: CGPoint(x: x + 0.75, y: 4.36),
                    control1: CGPoint(x: x + 0.27, y: 3.1),
                    control2: CGPoint(x: x + 0.8, y: 3.53)
                )
                steam.addCurve(
                    to: CGPoint(x: x - 0.25, y: 6.38),
                    control1: CGPoint(x: x + 0.69, y: 5.19),
                    control2: CGPoint(x: x - 0.18, y: 5.56)
                )
                steam.addCurve(
                    to: CGPoint(x: x + 0.48, y: 8),
                    control1: CGPoint(x: x - 0.3, y: 7.16),
                    control2: CGPoint(x: x + 0.09, y: 7.62)
                )
                strokePath(steam)
            }
        case .wine:
            line(8, 22, 16, 22)
            line(7, 10, 17, 10)
            line(12, 15, 12, 22)
            var glass = Path()
            glass.move(to: CGPoint(x: 12, y: 15))
            glass.addCurve(
                to: CGPoint(x: 17, y: 10),
                control1: CGPoint(x: 14.76, y: 15),
                control2: CGPoint(x: 17, y: 12.76)
            )
            glass.addCurve(
                to: CGPoint(x: 15, y: 2),
                control1: CGPoint(x: 17, y: 8),
                control2: CGPoint(x: 16.5, y: 6)
            )
            glass.addLine(to: CGPoint(x: 9, y: 2))
            glass.addCurve(
                to: CGPoint(x: 7, y: 10),
                control1: CGPoint(x: 7.5, y: 6),
                control2: CGPoint(x: 7, y: 8)
            )
            glass.addCurve(
                to: CGPoint(x: 12, y: 15),
                control1: CGPoint(x: 7, y: 12.76),
                control2: CGPoint(x: 9.24, y: 15)
            )
            glass.closeSubpath()
            strokePath(glass)
        case .bell:
            var path = Path()
            path.move(to: CGPoint(x: 10.27, y: 21))
            path.addQuadCurve(to: CGPoint(x: 13.73, y: 21), control: CGPoint(x: 12, y: 23))
            strokePath(path)

            var body = Path()
            body.move(to: CGPoint(x: 3.26, y: 15.33))
            body.addCurve(
                to: CGPoint(x: 6, y: 8),
                control1: CGPoint(x: 4.7, y: 13.9),
                control2: CGPoint(x: 6, y: 12.4)
            )
            body.addCurve(
                to: CGPoint(x: 18, y: 8),
                control1: CGPoint(x: 6, y: 0),
                control2: CGPoint(x: 18, y: 0)
            )
            body.addCurve(
                to: CGPoint(x: 20.74, y: 15.33),
                control1: CGPoint(x: 18, y: 12.4),
                control2: CGPoint(x: 19.3, y: 13.9)
            )
            body.addQuadCurve(to: CGPoint(x: 20, y: 17), control: CGPoint(x: 21.55, y: 17))
            body.addLine(to: CGPoint(x: 4, y: 17))
            body.addQuadCurve(to: CGPoint(x: 3.26, y: 15.33), control: CGPoint(x: 2.45, y: 17))
            strokePath(body)
        case .bookmark:
            let cornerKappa: CGFloat = 0.5522847498 * 2
            var path = Path()
            path.move(to: CGPoint(x: 19, y: 21))
            path.addLine(to: CGPoint(x: 12, y: 17))
            path.addLine(to: CGPoint(x: 5, y: 21))
            path.addLine(to: CGPoint(x: 5, y: 5))
            path.addCurve(
                to: CGPoint(x: 7, y: 3),
                control1: CGPoint(x: 5, y: 5 - cornerKappa),
                control2: CGPoint(x: 7 - cornerKappa, y: 3)
            )
            path.addLine(to: CGPoint(x: 17, y: 3))
            path.addCurve(
                to: CGPoint(x: 19, y: 5),
                control1: CGPoint(x: 17 + cornerKappa, y: 3),
                control2: CGPoint(x: 19, y: 5 - cornerKappa)
            )
            path.addLine(to: CGPoint(x: 19, y: 21))
            path.closeSubpath()
            fillThenStroke(path)
        case .calendarCheck:
            if filled {
                line(8, 2, 8, 6)
                line(16, 2, 16, 6)
                let calendarRect = Path(roundedRect: CGRect(x: 3, y: 4, width: 18, height: 18), cornerRadius: 2)
                context.fill(calendarRect, with: .foreground)
                context.stroke(calendarRect, with: .foreground, style: stroke)

                let outerRect = Path(roundedRect: CGRect(x: 2, y: 3, width: 20, height: 20), cornerRadius: 3)
                context.clip(to: outerRect)

                var headerLine = Path()
                headerLine.move(to: CGPoint(x: 1, y: 10))
                headerLine.addLine(to: CGPoint(x: 23, y: 10))
                context.stroke(headerLine, with: .color(.white), style: StrokeStyle(lineWidth: strokeWidth, lineCap: .butt))

                var check = Path()
                check.move(to: CGPoint(x: 9, y: 16))
                check.addLine(to: CGPoint(x: 11, y: 18))
                check.addLine(to: CGPoint(x: 15, y: 14))
                context.stroke(check, with: .color(.white), style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round))
            } else {
                line(8, 2, 8, 6)
                line(16, 2, 16, 6)
                rect(3, 4, 18, 18, 2)
                line(3, 10, 21, 10)
                polyline([CGPoint(x: 9, y: 16), CGPoint(x: 11, y: 18), CGPoint(x: 15, y: 14)])
            }
        case .camera:
            var path = Path()
            path.move(to: CGPoint(x: 14.5, y: 4))
            path.addLine(to: CGPoint(x: 9.5, y: 4))
            path.addLine(to: CGPoint(x: 7, y: 7))
            path.addLine(to: CGPoint(x: 4, y: 7))
            path.addQuadCurve(to: CGPoint(x: 2, y: 9), control: CGPoint(x: 2, y: 7))
            path.addLine(to: CGPoint(x: 2, y: 18))
            path.addQuadCurve(to: CGPoint(x: 4, y: 20), control: CGPoint(x: 2, y: 20))
            path.addLine(to: CGPoint(x: 20, y: 20))
            path.addQuadCurve(to: CGPoint(x: 22, y: 18), control: CGPoint(x: 22, y: 20))
            path.addLine(to: CGPoint(x: 22, y: 9))
            path.addQuadCurve(to: CGPoint(x: 20, y: 7), control: CGPoint(x: 22, y: 7))
            path.addLine(to: CGPoint(x: 17, y: 7))
            path.closeSubpath()
            strokePath(path)
            circle(12, 13, 3)
        case .chefHat:
            var path = Path()
            path.move(to: CGPoint(x: 17, y: 21))
            path.addLine(to: CGPoint(x: 7, y: 21))
            path.addLine(to: CGPoint(x: 6, y: 14.65))
            path.addCurve(to: CGPoint(x: 7.4, y: 6.02), control1: CGPoint(x: 2, y: 12.8), control2: CGPoint(x: 3.2, y: 6.2))
            path.addCurve(to: CGPoint(x: 16.6, y: 6.02), control1: CGPoint(x: 9, y: 0.7), control2: CGPoint(x: 15, y: 0.7))
            path.addCurve(to: CGPoint(x: 18, y: 14.65), control1: CGPoint(x: 20.8, y: 6.2), control2: CGPoint(x: 22, y: 12.8))
            path.addLine(to: CGPoint(x: 18, y: 20))
            strokePath(path)
            line(6, 17, 18, 17)
        case .check:
            polyline([CGPoint(x: 20, y: 6), CGPoint(x: 9, y: 17), CGPoint(x: 4, y: 12)])
        case .chevronDown:
            polyline([CGPoint(x: 6, y: 9), CGPoint(x: 12, y: 15), CGPoint(x: 18, y: 9)])
        case .chevronLeft:
            polyline([CGPoint(x: 15, y: 18), CGPoint(x: 9, y: 12), CGPoint(x: 15, y: 6)])
        case .chevronRight:
            polyline([CGPoint(x: 9, y: 18), CGPoint(x: 15, y: 12), CGPoint(x: 9, y: 6)])
        case .chevronUp:
            polyline([CGPoint(x: 18, y: 15), CGPoint(x: 12, y: 9), CGPoint(x: 6, y: 15)])
        case .circleCheck:
            if filled {
                filledCircle(12, 12, 10)
                var path = Path()
                path.move(to: CGPoint(x: 9, y: 12))
                path.addLine(to: CGPoint(x: 11, y: 14))
                path.addLine(to: CGPoint(x: 15, y: 10))
                context.stroke(path, with: .color(.white), style: stroke)
            } else {
                circle(12, 12, 10)
                polyline([CGPoint(x: 9, y: 12), CGPoint(x: 11, y: 14), CGPoint(x: 15, y: 10)])
            }
        case .circleArrowDown:
            circle(12, 12, 10)
            line(12, 8, 12, 16)
            polyline([CGPoint(x: 8, y: 12), CGPoint(x: 12, y: 16), CGPoint(x: 16, y: 12)])
        case .circleDot:
            circle(12, 12, 10)
            circle(12, 12, 2)
        case .circleHelp:
            circle(12, 12, 10)
            var path = Path()
            let helpStart = CGPoint(x: 9.09, y: 9)
            let helpArcEnd = CGPoint(x: 14.92, y: 10)
            path.move(to: helpStart)
            addSvgArc(
                to: &path,
                from: helpStart,
                to: helpArcEnd,
                radius: 3,
                largeArc: false,
                sweep: true
            )
            path.addCurve(
                to: CGPoint(x: 11.92, y: 13),
                control1: CGPoint(x: 14.92, y: 12),
                control2: CGPoint(x: 11.92, y: 13)
            )
            strokePath(path)
            line(12, 17, 12.01, 17)
        case .circlePlus:
            circle(12, 12, 10)
            line(8, 12, 16, 12)
            line(12, 8, 12, 16)
        case .clock:
            circle(12, 12, 10)
            polyline([CGPoint(x: 12, y: 6), CGPoint(x: 12, y: 12), CGPoint(x: 16, y: 14)])
        case .copy:
            rect(8, 8, 14, 14, 2)
            var back = Path()
            back.move(to: CGPoint(x: 4, y: 16))
            back.addQuadCurve(to: CGPoint(x: 2, y: 14), control: CGPoint(x: 2, y: 16))
            back.addLine(to: CGPoint(x: 2, y: 4))
            back.addQuadCurve(to: CGPoint(x: 4, y: 2), control: CGPoint(x: 2, y: 2))
            back.addLine(to: CGPoint(x: 14, y: 2))
            back.addQuadCurve(to: CGPoint(x: 16, y: 4), control: CGPoint(x: 16, y: 2))
            strokePath(back)
        case .droplet:
            var path = Path()
            path.move(to: CGPoint(x: 12, y: 2))
            path.addCurve(to: CGPoint(x: 5, y: 13), control1: CGPoint(x: 9, y: 6), control2: CGPoint(x: 5, y: 9))
            path.addCurve(to: CGPoint(x: 12, y: 22), control1: CGPoint(x: 5, y: 18), control2: CGPoint(x: 8, y: 22))
            path.addCurve(to: CGPoint(x: 19, y: 13), control1: CGPoint(x: 16, y: 22), control2: CGPoint(x: 19, y: 18))
            path.addCurve(to: CGPoint(x: 12, y: 2), control1: CGPoint(x: 19, y: 9), control2: CGPoint(x: 15, y: 6))
            path.closeSubpath()
            fillThenStroke(path)
        case .ellipsis:
            circle(5, 12, 1)
            circle(12, 12, 1)
            circle(19, 12, 1)
        case .eye:
            var eye = Path()
            let eyeStart = CGPoint(x: 2.062, y: 12.348)
            let eyeTopLeft = CGPoint(x: 2.062, y: 11.652)
            let eyeTopRight = CGPoint(x: 21.938, y: 11.652)
            let eyeBottomRight = CGPoint(x: 21.938, y: 12.348)
            eye.move(to: eyeStart)
            addSvgArc(
                to: &eye,
                from: eyeStart,
                to: eyeTopLeft,
                radius: 1,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &eye,
                from: eyeTopLeft,
                to: eyeTopRight,
                radius: 10.75,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &eye,
                from: eyeTopRight,
                to: eyeBottomRight,
                radius: 1,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &eye,
                from: eyeBottomRight,
                to: eyeStart,
                radius: 10.75,
                largeArc: false,
                sweep: true
            )
            strokePath(eye)
            circle(12, 12, 3)
        case .eyeOff:
            var eye = Path()
            let eyeStart = CGPoint(x: 2.062, y: 12.348)
            let eyeTopLeft = CGPoint(x: 2.062, y: 11.652)
            let eyeTopRight = CGPoint(x: 21.938, y: 11.652)
            let eyeBottomRight = CGPoint(x: 21.938, y: 12.348)
            eye.move(to: eyeStart)
            addSvgArc(
                to: &eye,
                from: eyeStart,
                to: eyeTopLeft,
                radius: 1,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &eye,
                from: eyeTopLeft,
                to: eyeTopRight,
                radius: 10.75,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &eye,
                from: eyeTopRight,
                to: eyeBottomRight,
                radius: 1,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &eye,
                from: eyeBottomRight,
                to: eyeStart,
                radius: 10.75,
                largeArc: false,
                sweep: true
            )
            strokePath(eye)

            var pupil = Path()
            pupil.move(to: CGPoint(x: 10.1, y: 10.1))
            pupil.addCurve(
                to: CGPoint(x: 13.9, y: 13.9),
                control1: CGPoint(x: 9.3, y: 11.4),
                control2: CGPoint(x: 11.6, y: 14.7)
            )
            strokePath(pupil)
            line(3, 3, 21, 21)
        case .globe:
            if filled {
                let circlePath = Path(ellipseIn: CGRect(x: 2, y: 2, width: 20, height: 20))
                context.fill(circlePath, with: .foreground)
                context.stroke(circlePath, with: .foreground, style: stroke)

                let outerClip = Path(ellipseIn: CGRect(x: 1, y: 1, width: 22, height: 22))
                context.clip(to: outerClip)

                var vertical = Path()
                vertical.move(to: CGPoint(x: 12, y: 0))
                vertical.addCurve(
                    to: CGPoint(x: 12, y: 24),
                    control1: CGPoint(x: 7.5, y: 6),
                    control2: CGPoint(x: 7.5, y: 18)
                )
                vertical.move(to: CGPoint(x: 12, y: 0))
                vertical.addCurve(
                    to: CGPoint(x: 12, y: 24),
                    control1: CGPoint(x: 16.5, y: 6),
                    control2: CGPoint(x: 16.5, y: 18)
                )
                context.stroke(vertical, with: .color(.white), style: stroke)

                var hLines = Path()
                hLines.move(to: CGPoint(x: 0, y: 12))
                hLines.addLine(to: CGPoint(x: 24, y: 12))
                hLines.move(to: CGPoint(x: 0, y: 7))
                hLines.addLine(to: CGPoint(x: 24, y: 7))
                hLines.move(to: CGPoint(x: 0, y: 17))
                hLines.addLine(to: CGPoint(x: 24, y: 17))
                context.stroke(hLines, with: .color(.white), style: stroke)
            } else {
                circle(12, 12, 10)
                line(2, 12, 22, 12)
                var vertical = Path()
                vertical.move(to: CGPoint(x: 12, y: 2))
                vertical.addCurve(
                    to: CGPoint(x: 12, y: 22),
                    control1: CGPoint(x: 7.5, y: 6),
                    control2: CGPoint(x: 7.5, y: 18)
                )
                vertical.move(to: CGPoint(x: 12, y: 2))
                vertical.addCurve(
                    to: CGPoint(x: 12, y: 22),
                    control1: CGPoint(x: 16.5, y: 6),
                    control2: CGPoint(x: 16.5, y: 18)
                )
                strokePath(vertical)
                line(4, 7, 20, 7)
                line(4, 17, 20, 17)
            }
        case .heart:
            var path = Path()
            path.move(to: CGPoint(x: 19, y: 14))
            path.addCurve(to: CGPoint(x: 22, y: 8.5), control1: CGPoint(x: 20.5, y: 12.5), control2: CGPoint(x: 22, y: 10.8))
            path.addCurve(to: CGPoint(x: 16.5, y: 3), control1: CGPoint(x: 22, y: 5.5), control2: CGPoint(x: 19.5, y: 3))
            path.addCurve(to: CGPoint(x: 12, y: 5), control1: CGPoint(x: 14.7, y: 3), control2: CGPoint(x: 13.5, y: 3.5))
            path.addCurve(to: CGPoint(x: 7.5, y: 3), control1: CGPoint(x: 10.5, y: 3.5), control2: CGPoint(x: 9.3, y: 3))
            path.addCurve(to: CGPoint(x: 2, y: 8.5), control1: CGPoint(x: 4.5, y: 3), control2: CGPoint(x: 2, y: 5.5))
            path.addCurve(to: CGPoint(x: 5, y: 14), control1: CGPoint(x: 2, y: 10.8), control2: CGPoint(x: 3.5, y: 12.5))
            path.addLine(to: CGPoint(x: 12, y: 21))
            path.closeSubpath()
            fillThenStroke(path)
        case .image:
            rect(3, 3, 18, 18, 2)
            circle(9, 9, 2)
            var imagePath = Path()
            imagePath.move(to: CGPoint(x: 21, y: 15))
            imagePath.addLine(to: CGPoint(x: 17.914, y: 11.914))
            imagePath.addCurve(
                to: CGPoint(x: 15.086, y: 11.914),
                control1: CGPoint(x: 17.133, y: 11.133),
                control2: CGPoint(x: 15.867, y: 11.133)
            )
            imagePath.addLine(to: CGPoint(x: 6, y: 21))
            strokePath(imagePath)
        case .info:
            circle(12, 12, 10)
            line(12, 16, 12, 12)
            line(12, 8, 12.01, 8)
        case .leaf:
            var path = Path()
            path.move(to: CGPoint(x: 11, y: 20))
            path.addCurve(to: CGPoint(x: 20, y: 4), control1: CGPoint(x: 16, y: 20), control2: CGPoint(x: 22, y: 12))
            path.addCurve(to: CGPoint(x: 4, y: 13), control1: CGPoint(x: 11, y: 2), control2: CGPoint(x: 4, y: 6))
            path.addCurve(to: CGPoint(x: 11, y: 20), control1: CGPoint(x: 4, y: 17), control2: CGPoint(x: 7, y: 20))
            strokePath(path)
            line(4, 20, 14, 10)
        case .link:
            var firstLink = Path()
            firstLink.move(to: CGPoint(x: 10, y: 13))
            firstLink.addCurve(
                to: CGPoint(x: 17.54, y: 13.54),
                control1: CGPoint(x: 11.95, y: 14.95),
                control2: CGPoint(x: 15.12, y: 14.95)
            )
            firstLink.addLine(to: CGPoint(x: 20.54, y: 10.54))
            firstLink.addCurve(
                to: CGPoint(x: 13.46, y: 3.46),
                control1: CGPoint(x: 25.26, y: 5.82),
                control2: CGPoint(x: 18.18, y: -1.26)
            )
            firstLink.addLine(to: CGPoint(x: 11.75, y: 5.17))
            strokePath(firstLink)

            var secondLink = Path()
            secondLink.move(to: CGPoint(x: 14, y: 11))
            secondLink.addCurve(
                to: CGPoint(x: 6.46, y: 10.46),
                control1: CGPoint(x: 12.05, y: 9.05),
                control2: CGPoint(x: 8.88, y: 9.05)
            )
            secondLink.addLine(to: CGPoint(x: 3.46, y: 13.46))
            secondLink.addCurve(
                to: CGPoint(x: 10.54, y: 20.54),
                control1: CGPoint(x: -1.26, y: 18.18),
                control2: CGPoint(x: 5.82, y: 25.26)
            )
            secondLink.addLine(to: CGPoint(x: 12.25, y: 18.83))
            strokePath(secondLink)
        case .logOut:
            var path = Path()
            path.move(to: CGPoint(x: 9, y: 21))
            path.addLine(to: CGPoint(x: 5, y: 21))
            path.addQuadCurve(to: CGPoint(x: 3, y: 19), control: CGPoint(x: 3, y: 21))
            path.addLine(to: CGPoint(x: 3, y: 5))
            path.addQuadCurve(to: CGPoint(x: 5, y: 3), control: CGPoint(x: 3, y: 3))
            path.addLine(to: CGPoint(x: 9, y: 3))
            strokePath(path)
            polyline([CGPoint(x: 16, y: 17), CGPoint(x: 21, y: 12), CGPoint(x: 16, y: 7)])
            line(21, 12, 9, 12)
        case .mail:
            rect(2, 4, 20, 16, 2)
            polyline([CGPoint(x: 22, y: 7), CGPoint(x: 13, y: 12.7), CGPoint(x: 11, y: 12.7), CGPoint(x: 2, y: 7)])
        case .mapPin:
            var path = Path()
            path.move(to: CGPoint(x: 20, y: 10))
            path.addCurve(
                to: CGPoint(x: 12.6, y: 21.8),
                control1: CGPoint(x: 20, y: 15),
                control2: CGPoint(x: 14.5, y: 20.2)
            )
            path.addQuadCurve(
                to: CGPoint(x: 11.4, y: 21.8),
                control: CGPoint(x: 12, y: 22.2)
            )
            path.addCurve(
                to: CGPoint(x: 4, y: 10),
                control1: CGPoint(x: 9.5, y: 20.2),
                control2: CGPoint(x: 4, y: 15)
            )
            path.addCurve(
                to: CGPoint(x: 12, y: 2),
                control1: CGPoint(x: 4, y: 5.6),
                control2: CGPoint(x: 7.6, y: 2)
            )
            path.addCurve(
                to: CGPoint(x: 20, y: 10),
                control1: CGPoint(x: 16.4, y: 2),
                control2: CGPoint(x: 20, y: 5.6)
            )
            strokePath(path)
            circle(12, 10, 3)
        case .menu:
            line(4, 6, 20, 6)
            line(4, 12, 20, 12)
            line(4, 18, 20, 18)
        case .messageCircle:
            var path = Path()
            path.move(to: CGPoint(x: 7.9, y: 20))
            path.addCurve(to: CGPoint(x: 12, y: 21), control1: CGPoint(x: 9.2, y: 20.7), control2: CGPoint(x: 10.6, y: 21))
            path.addCurve(to: CGPoint(x: 21, y: 12), control1: CGPoint(x: 17, y: 21), control2: CGPoint(x: 21, y: 17))
            path.addCurve(to: CGPoint(x: 12, y: 3), control1: CGPoint(x: 21, y: 7), control2: CGPoint(x: 17, y: 3))
            path.addCurve(to: CGPoint(x: 3, y: 12), control1: CGPoint(x: 7, y: 3), control2: CGPoint(x: 3, y: 7))
            path.addCurve(to: CGPoint(x: 4, y: 16.1), control1: CGPoint(x: 3, y: 13.4), control2: CGPoint(x: 3.3, y: 14.8))
            path.addLine(to: CGPoint(x: 2, y: 22))
            path.closeSubpath()
            strokePath(path)
        case .minus:
            line(5, 12, 19, 12)
        case .pencil:
            var path = Path()
            path.move(to: CGPoint(x: 21.17, y: 6.81))
            path.addCurve(to: CGPoint(x: 17.19, y: 2.82), control1: CGPoint(x: 22.27, y: 5.71), control2: CGPoint(x: 18.29, y: 1.72))
            path.addLine(to: CGPoint(x: 3.84, y: 16.17))
            path.addLine(to: CGPoint(x: 2.02, y: 21.36))
            path.addLine(to: CGPoint(x: 7.0, y: 20.66))
            path.closeSubpath()
            strokePath(path)
            line(15, 5, 19, 9)
        case .phone:
            var path = Path()
            path.move(to: CGPoint(x: 13.83, y: 16.57))
            path.addQuadCurve(to: CGPoint(x: 15.05, y: 16.27), control: CGPoint(x: 14.35, y: 16.8))
            path.addLine(to: CGPoint(x: 15.4, y: 15.8))
            path.addQuadCurve(to: CGPoint(x: 17, y: 15), control: CGPoint(x: 16, y: 15))
            path.addLine(to: CGPoint(x: 20, y: 15))
            path.addQuadCurve(to: CGPoint(x: 22, y: 17), control: CGPoint(x: 22, y: 15))
            path.addLine(to: CGPoint(x: 22, y: 20))
            path.addQuadCurve(to: CGPoint(x: 20, y: 22), control: CGPoint(x: 22, y: 22))
            path.addCurve(
                to: CGPoint(x: 2, y: 4),
                control1: CGPoint(x: 10.06, y: 22),
                control2: CGPoint(x: 2, y: 13.94)
            )
            path.addQuadCurve(to: CGPoint(x: 4, y: 2), control: CGPoint(x: 2, y: 2))
            path.addLine(to: CGPoint(x: 7, y: 2))
            path.addQuadCurve(to: CGPoint(x: 9, y: 4), control: CGPoint(x: 9, y: 2))
            path.addLine(to: CGPoint(x: 9, y: 7))
            path.addQuadCurve(to: CGPoint(x: 8.2, y: 8.6), control: CGPoint(x: 9, y: 8))
            path.addLine(to: CGPoint(x: 7.73, y: 8.95))
            path.addQuadCurve(to: CGPoint(x: 7.44, y: 10.18), control: CGPoint(x: 7.2, y: 9.4))
            path.addCurve(
                to: CGPoint(x: 13.83, y: 16.57),
                control1: CGPoint(x: 8.78, y: 12.95),
                control2: CGPoint(x: 11.05, y: 15.22)
            )
            strokePath(path)
        case .plus:
            line(5, 12, 19, 12)
            line(12, 5, 12, 19)
        case .refreshCw:
            var top = Path()
            let topStart = CGPoint(x: 3, y: 12)
            let topArcMid = CGPoint(x: 12, y: 3)
            let topArcEnd = CGPoint(x: 18.74, y: 5.74)
            top.move(to: topStart)
            addSvgArc(
                to: &top,
                from: topStart,
                to: topArcMid,
                radius: 9,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &top,
                from: topArcMid,
                to: topArcEnd,
                radius: 9.75,
                largeArc: false,
                sweep: true
            )
            top.addLine(to: CGPoint(x: 21, y: 8))
            strokePath(top)
            line(21, 3, 21, 8)
            line(16, 8, 21, 8)

            var bottom = Path()
            let bottomStart = CGPoint(x: 21, y: 12)
            let bottomArcMid = CGPoint(x: 12, y: 21)
            let bottomArcEnd = CGPoint(x: 5.26, y: 18.26)
            bottom.move(to: bottomStart)
            addSvgArc(
                to: &bottom,
                from: bottomStart,
                to: bottomArcMid,
                radius: 9,
                largeArc: false,
                sweep: true
            )
            addSvgArc(
                to: &bottom,
                from: bottomArcMid,
                to: bottomArcEnd,
                radius: 9.75,
                largeArc: false,
                sweep: true
            )
            bottom.addLine(to: CGPoint(x: 3, y: 16))
            strokePath(bottom)
            line(3, 21, 3, 16)
            line(8, 16, 3, 16)
        case .search:
            circle(11, 11, 8)
            line(16.7, 16.7, 21, 21)
        case .send:
            polyline([
                CGPoint(x: 22, y: 2),
                CGPoint(x: 15, y: 22),
                CGPoint(x: 11, y: 13),
                CGPoint(x: 2, y: 9),
                CGPoint(x: 22, y: 2)
            ], closed: true)
            line(22, 2, 11, 13)
        case .settings:
            var path = Path()
            path.move(to: CGPoint(x: 12.22, y: 2))
            path.addLine(to: CGPoint(x: 11.78, y: 2))
            path.addQuadCurve(to: CGPoint(x: 9.78, y: 4), control: CGPoint(x: 9.78, y: 2))
            path.addLine(to: CGPoint(x: 9.78, y: 4.18))
            path.addQuadCurve(to: CGPoint(x: 8.78, y: 5.91), control: CGPoint(x: 9.78, y: 5.2))
            path.addLine(to: CGPoint(x: 8.35, y: 6.16))
            path.addQuadCurve(to: CGPoint(x: 6.35, y: 6.16), control: CGPoint(x: 7.35, y: 6.72))
            path.addLine(to: CGPoint(x: 6.2, y: 6.08))
            path.addQuadCurve(to: CGPoint(x: 3.47, y: 6.81), control: CGPoint(x: 4.6, y: 5.18))
            path.addLine(to: CGPoint(x: 3.25, y: 7.19))
            path.addQuadCurve(to: CGPoint(x: 3.98, y: 9.92), control: CGPoint(x: 2.36, y: 8.77))
            path.addLine(to: CGPoint(x: 4.13, y: 10.02))
            path.addQuadCurve(to: CGPoint(x: 5.13, y: 11.74), control: CGPoint(x: 5.13, y: 10.7))
            path.addLine(to: CGPoint(x: 5.13, y: 12.25))
            path.addQuadCurve(to: CGPoint(x: 4.13, y: 13.99), control: CGPoint(x: 5.13, y: 13.3))
            path.addLine(to: CGPoint(x: 3.98, y: 14.08))
            path.addQuadCurve(to: CGPoint(x: 3.25, y: 16.81), control: CGPoint(x: 2.36, y: 15.23))
            path.addLine(to: CGPoint(x: 3.47, y: 17.19))
            path.addQuadCurve(to: CGPoint(x: 6.2, y: 17.92), control: CGPoint(x: 4.6, y: 18.82))
            path.addLine(to: CGPoint(x: 6.35, y: 17.84))
            path.addQuadCurve(to: CGPoint(x: 8.35, y: 17.84), control: CGPoint(x: 7.35, y: 17.28))
            path.addLine(to: CGPoint(x: 8.78, y: 18.09))
            path.addQuadCurve(to: CGPoint(x: 9.78, y: 19.82), control: CGPoint(x: 9.78, y: 18.8))
            path.addLine(to: CGPoint(x: 9.78, y: 20))
            path.addQuadCurve(to: CGPoint(x: 11.78, y: 22), control: CGPoint(x: 9.78, y: 22))
            path.addLine(to: CGPoint(x: 12.22, y: 22))
            path.addQuadCurve(to: CGPoint(x: 14.22, y: 20), control: CGPoint(x: 14.22, y: 22))
            path.addLine(to: CGPoint(x: 14.22, y: 19.82))
            path.addQuadCurve(to: CGPoint(x: 15.22, y: 18.09), control: CGPoint(x: 14.22, y: 18.8))
            path.addLine(to: CGPoint(x: 15.65, y: 17.84))
            path.addQuadCurve(to: CGPoint(x: 17.65, y: 17.84), control: CGPoint(x: 16.65, y: 17.28))
            path.addLine(to: CGPoint(x: 17.8, y: 17.92))
            path.addQuadCurve(to: CGPoint(x: 20.53, y: 17.19), control: CGPoint(x: 19.4, y: 18.82))
            path.addLine(to: CGPoint(x: 20.75, y: 16.8))
            path.addQuadCurve(to: CGPoint(x: 20.02, y: 14.07), control: CGPoint(x: 21.64, y: 15.23))
            path.addLine(to: CGPoint(x: 19.87, y: 13.99))
            path.addQuadCurve(to: CGPoint(x: 18.87, y: 12.25), control: CGPoint(x: 18.87, y: 13.3))
            path.addLine(to: CGPoint(x: 18.87, y: 11.75))
            path.addQuadCurve(to: CGPoint(x: 19.87, y: 10.01), control: CGPoint(x: 18.87, y: 10.7))
            path.addLine(to: CGPoint(x: 20.02, y: 9.92))
            path.addQuadCurve(to: CGPoint(x: 20.75, y: 7.19), control: CGPoint(x: 21.64, y: 8.77))
            path.addLine(to: CGPoint(x: 20.53, y: 6.81))
            path.addQuadCurve(to: CGPoint(x: 17.8, y: 6.08), control: CGPoint(x: 19.4, y: 5.18))
            path.addLine(to: CGPoint(x: 17.65, y: 6.16))
            path.addQuadCurve(to: CGPoint(x: 15.65, y: 6.16), control: CGPoint(x: 16.65, y: 6.72))
            path.addLine(to: CGPoint(x: 15.22, y: 5.91))
            path.addQuadCurve(to: CGPoint(x: 14.22, y: 4.18), control: CGPoint(x: 14.22, y: 5.2))
            path.addLine(to: CGPoint(x: 14.22, y: 4))
            path.addQuadCurve(to: CGPoint(x: 12.22, y: 2), control: CGPoint(x: 14.22, y: 2))
            path.closeSubpath()
            strokePath(path)
            circle(12, 12, 3)
        case .share:
            var box = Path()
            box.move(to: CGPoint(x: 4, y: 12))
            box.addLine(to: CGPoint(x: 4, y: 20))
            box.addQuadCurve(to: CGPoint(x: 6, y: 22), control: CGPoint(x: 4, y: 22))
            box.addLine(to: CGPoint(x: 18, y: 22))
            box.addQuadCurve(to: CGPoint(x: 20, y: 20), control: CGPoint(x: 20, y: 22))
            box.addLine(to: CGPoint(x: 20, y: 12))
            strokePath(box)
            polyline([CGPoint(x: 16, y: 6), CGPoint(x: 12, y: 2), CGPoint(x: 8, y: 6)])
            line(12, 2, 12, 15)
        case .shieldCheck:
            var path = Path()
            path.move(to: CGPoint(x: 20, y: 13))
            path.addCurve(to: CGPoint(x: 12, y: 22), control1: CGPoint(x: 20, y: 18), control2: CGPoint(x: 16, y: 20.5))
            path.addCurve(to: CGPoint(x: 4, y: 13), control1: CGPoint(x: 8, y: 20.5), control2: CGPoint(x: 4, y: 18))
            path.addLine(to: CGPoint(x: 4, y: 6))
            path.addCurve(to: CGPoint(x: 12, y: 2.3), control1: CGPoint(x: 7, y: 6), control2: CGPoint(x: 10, y: 3.8))
            path.addCurve(to: CGPoint(x: 20, y: 6), control1: CGPoint(x: 14, y: 3.8), control2: CGPoint(x: 17, y: 6))
            path.closeSubpath()
            strokePath(path)
            polyline([CGPoint(x: 9, y: 12), CGPoint(x: 11, y: 14), CGPoint(x: 15, y: 10)])
        case .sparkles:
            polyline([
                CGPoint(x: 12, y: 2),
                CGPoint(x: 15, y: 9),
                CGPoint(x: 22, y: 12),
                CGPoint(x: 15, y: 15),
                CGPoint(x: 12, y: 22),
                CGPoint(x: 9, y: 15),
                CGPoint(x: 2, y: 12),
                CGPoint(x: 9, y: 9)
            ], closed: true)
            if filled {
                polyline([
                    CGPoint(x: 20, y: 3),
                    CGPoint(x: 20.8, y: 5),
                    CGPoint(x: 22, y: 5),
                    CGPoint(x: 20.8, y: 5.5),
                    CGPoint(x: 20, y: 7),
                    CGPoint(x: 19.2, y: 5.5),
                    CGPoint(x: 18, y: 5),
                    CGPoint(x: 19.2, y: 5)
                ], closed: true)
                polyline([
                    CGPoint(x: 4, y: 17),
                    CGPoint(x: 4.5, y: 18),
                    CGPoint(x: 5, y: 18),
                    CGPoint(x: 4.5, y: 18.5),
                    CGPoint(x: 4, y: 19),
                    CGPoint(x: 3.5, y: 18.5),
                    CGPoint(x: 3, y: 18),
                    CGPoint(x: 3.5, y: 18)
                ], closed: true)
            } else {
                line(20, 3, 20, 7)
                line(22, 5, 18, 5)
                line(4, 17, 4, 19)
                line(5, 18, 3, 18)
            }
        case .squarePen:
            var square = Path()
            let squareStart = CGPoint(x: 12, y: 3)
            let squareTopLeftStart = CGPoint(x: 5, y: 3)
            let squareLeftTopEnd = CGPoint(x: 3, y: 5)
            let squareLeftBottomStart = CGPoint(x: 3, y: 19)
            let squareBottomLeftEnd = CGPoint(x: 5, y: 21)
            let squareBottomRightStart = CGPoint(x: 19, y: 21)
            let squareRightBottomEnd = CGPoint(x: 21, y: 19)
            square.move(to: squareStart)
            square.addLine(to: squareTopLeftStart)
            addSvgArc(
                to: &square,
                from: squareTopLeftStart,
                to: squareLeftTopEnd,
                radius: 2,
                largeArc: false,
                sweep: false
            )
            square.addLine(to: squareLeftBottomStart)
            addSvgArc(
                to: &square,
                from: squareLeftBottomStart,
                to: squareBottomLeftEnd,
                radius: 2,
                largeArc: false,
                sweep: false
            )
            square.addLine(to: squareBottomRightStart)
            addSvgArc(
                to: &square,
                from: squareBottomRightStart,
                to: squareRightBottomEnd,
                radius: 2,
                largeArc: false,
                sweep: false
            )
            square.addLine(to: CGPoint(x: 21, y: 12))
            strokePath(square)

            var pen = Path()
            let penStart = CGPoint(x: 18.375, y: 2.625)
            let penArcEnd = CGPoint(x: 21.375, y: 5.625)
            let penTipStart = CGPoint(x: 12.362, y: 14.639)
            let penTipCurveEnd = CGPoint(x: 11.509, y: 15.144)
            let penPocketStart = CGPoint(x: 8.636, y: 15.984)
            let penPocketEnd = CGPoint(x: 8.016, y: 15.364)
            let penGuideStart = CGPoint(x: 8.856, y: 12.491)
            let penGuideEnd = CGPoint(x: 9.362, y: 11.639)
            pen.move(to: penStart)
            addSvgArc(
                to: &pen,
                from: penStart,
                to: penArcEnd,
                radius: 1,
                largeArc: false,
                sweep: true
            )
            pen.addLine(to: penTipStart)
            addSvgArc(
                to: &pen,
                from: penTipStart,
                to: penTipCurveEnd,
                radius: 2,
                largeArc: false,
                sweep: true
            )
            pen.addLine(to: penPocketStart)
            addSvgArc(
                to: &pen,
                from: penPocketStart,
                to: penPocketEnd,
                radius: 0.5,
                largeArc: false,
                sweep: true
            )
            pen.addLine(to: penGuideStart)
            addSvgArc(
                to: &pen,
                from: penGuideStart,
                to: penGuideEnd,
                radius: 2,
                largeArc: false,
                sweep: true
            )
            pen.closeSubpath()
            strokePath(pen)
        case .star:
            polyline([
                CGPoint(x: 12, y: 2.5),
                CGPoint(x: 14.8, y: 8.1),
                CGPoint(x: 21, y: 9),
                CGPoint(x: 16.5, y: 13.3),
                CGPoint(x: 17.6, y: 20.7),
                CGPoint(x: 12, y: 17.8),
                CGPoint(x: 6.4, y: 20.7),
                CGPoint(x: 7.5, y: 13.3),
                CGPoint(x: 3, y: 9),
                CGPoint(x: 9.2, y: 8.1)
            ], closed: true)
        case .store:
            if filled {
                var roof = Path()
                roof.move(to: CGPoint(x: 2, y: 7))
                roof.addLine(to: CGPoint(x: 6.4, y: 2.6))
                roof.addLine(to: CGPoint(x: 17.6, y: 2.6))
                roof.addLine(to: CGPoint(x: 22, y: 7))
                roof.closeSubpath()
                context.fill(roof, with: .foreground)
                context.stroke(roof, with: .foreground, style: stroke)

                var base = Path()
                base.move(to: CGPoint(x: 4, y: 7))
                base.addLine(to: CGPoint(x: 4, y: 20))
                base.addQuadCurve(to: CGPoint(x: 6, y: 22), control: CGPoint(x: 4, y: 22))
                base.addLine(to: CGPoint(x: 18, y: 22))
                base.addQuadCurve(to: CGPoint(x: 20, y: 20), control: CGPoint(x: 20, y: 22))
                base.addLine(to: CGPoint(x: 20, y: 7))
                base.closeSubpath()
                context.fill(base, with: .foreground)
                context.stroke(base, with: .foreground, style: stroke)

                var door = Path()
                door.move(to: CGPoint(x: 9, y: 22))
                door.addLine(to: CGPoint(x: 9, y: 16))
                door.addLine(to: CGPoint(x: 15, y: 16))
                door.addLine(to: CGPoint(x: 15, y: 22))
                context.stroke(door, with: .color(.white), style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round))
            } else {
                polyline([CGPoint(x: 2, y: 7), CGPoint(x: 6.4, y: 2.6), CGPoint(x: 17.6, y: 2.6), CGPoint(x: 22, y: 7)])
                line(2, 7, 22, 7)
                var base = Path()
                base.move(to: CGPoint(x: 4, y: 12))
                base.addLine(to: CGPoint(x: 4, y: 20))
                base.addQuadCurve(to: CGPoint(x: 6, y: 22), control: CGPoint(x: 4, y: 22))
                base.addLine(to: CGPoint(x: 18, y: 22))
                base.addQuadCurve(to: CGPoint(x: 20, y: 20), control: CGPoint(x: 20, y: 22))
                base.addLine(to: CGPoint(x: 20, y: 12))
                strokePath(base)
                polyline([CGPoint(x: 9, y: 22), CGPoint(x: 9, y: 18), CGPoint(x: 15, y: 18), CGPoint(x: 15, y: 22)])
            }
        case .sun:
            circle(12, 12, 4)
            line(12, 2, 12, 4)
            line(12, 20, 12, 22)
            line(2, 12, 4, 12)
            line(20, 12, 22, 12)
            line(4.9, 4.9, 6.3, 6.3)
            line(17.7, 17.7, 19.1, 19.1)
            line(19.1, 4.9, 17.7, 6.3)
            line(6.3, 17.7, 4.9, 19.1)
        case .switchCamera:
            var leftBody = Path()
            leftBody.move(to: CGPoint(x: 11, y: 19))
            leftBody.addLine(to: CGPoint(x: 4, y: 19))
            leftBody.addQuadCurve(to: CGPoint(x: 2, y: 17), control: CGPoint(x: 2, y: 19))
            leftBody.addLine(to: CGPoint(x: 2, y: 7))
            leftBody.addQuadCurve(to: CGPoint(x: 4, y: 5), control: CGPoint(x: 2, y: 5))
            leftBody.addLine(to: CGPoint(x: 9, y: 5))
            strokePath(leftBody)

            var rightBody = Path()
            rightBody.move(to: CGPoint(x: 13, y: 5))
            rightBody.addLine(to: CGPoint(x: 20, y: 5))
            rightBody.addQuadCurve(to: CGPoint(x: 22, y: 7), control: CGPoint(x: 22, y: 5))
            rightBody.addLine(to: CGPoint(x: 22, y: 17))
            rightBody.addQuadCurve(to: CGPoint(x: 20, y: 19), control: CGPoint(x: 22, y: 19))
            rightBody.addLine(to: CGPoint(x: 15, y: 19))
            strokePath(rightBody)

            circle(12, 12, 3)
            polyline([CGPoint(x: 18, y: 22), CGPoint(x: 15, y: 19), CGPoint(x: 18, y: 16)])
            polyline([CGPoint(x: 6, y: 2), CGPoint(x: 9, y: 5), CGPoint(x: 6, y: 8)])
        case .trash2:
            line(3, 6, 21, 6)
            var bin = Path()
            bin.move(to: CGPoint(x: 19, y: 6))
            bin.addLine(to: CGPoint(x: 19, y: 20))
            bin.addQuadCurve(to: CGPoint(x: 17, y: 22), control: CGPoint(x: 19, y: 22))
            bin.addLine(to: CGPoint(x: 7, y: 22))
            bin.addQuadCurve(to: CGPoint(x: 5, y: 20), control: CGPoint(x: 5, y: 22))
            bin.addLine(to: CGPoint(x: 5, y: 6))
            strokePath(bin)
            polyline([CGPoint(x: 8, y: 6), CGPoint(x: 8, y: 4), CGPoint(x: 16, y: 4), CGPoint(x: 16, y: 6)])
            line(10, 11, 10, 17)
            line(14, 11, 14, 17)
        case .trophy:
            polyline([CGPoint(x: 6, y: 9), CGPoint(x: 4.5, y: 9), CGPoint(x: 3, y: 7.5), CGPoint(x: 3, y: 5.5), CGPoint(x: 4.5, y: 4), CGPoint(x: 6, y: 4)])
            polyline([CGPoint(x: 18, y: 9), CGPoint(x: 19.5, y: 9), CGPoint(x: 21, y: 7.5), CGPoint(x: 21, y: 5.5), CGPoint(x: 19.5, y: 4), CGPoint(x: 18, y: 4)])
            polyline([CGPoint(x: 18, y: 2), CGPoint(x: 18, y: 9), CGPoint(x: 12, y: 15), CGPoint(x: 6, y: 9), CGPoint(x: 6, y: 2)], closed: true)
            line(4, 22, 20, 22)
            polyline([CGPoint(x: 10, y: 15), CGPoint(x: 10, y: 18), CGPoint(x: 7, y: 22)])
            polyline([CGPoint(x: 14, y: 15), CGPoint(x: 14, y: 18), CGPoint(x: 17, y: 22)])
        case .utensils:
            if filled {
                var fork = Path()
                fork.move(to: CGPoint(x: 3, y: 2))
                fork.addLine(to: CGPoint(x: 3, y: 9))
                fork.addLine(to: CGPoint(x: 5, y: 11))
                fork.addLine(to: CGPoint(x: 9, y: 11))
                fork.addLine(to: CGPoint(x: 11, y: 9))
                fork.addLine(to: CGPoint(x: 11, y: 2))
                strokePath(fork)
                line(7, 2, 7, 22)

                var knife = Path()
                knife.move(to: CGPoint(x: 21, y: 15))
                knife.addLine(to: CGPoint(x: 21, y: 2))
                knife.addCurve(to: CGPoint(x: 16, y: 7), control1: CGPoint(x: 17, y: 2), control2: CGPoint(x: 16, y: 5))
                knife.addLine(to: CGPoint(x: 16, y: 13))
                knife.addQuadCurve(to: CGPoint(x: 18, y: 15), control: CGPoint(x: 16, y: 15))
                knife.addLine(to: CGPoint(x: 21, y: 15))
                knife.closeSubpath()
                context.fill(knife, with: .foreground)
                context.stroke(knife, with: .foreground, style: stroke)
                line(21, 15, 21, 22)
            } else {
                polyline([CGPoint(x: 3, y: 2), CGPoint(x: 3, y: 9), CGPoint(x: 5, y: 11), CGPoint(x: 9, y: 11), CGPoint(x: 11, y: 9), CGPoint(x: 11, y: 2)])
                line(7, 2, 7, 22)
                var knife = Path()
                knife.move(to: CGPoint(x: 21, y: 15))
                knife.addLine(to: CGPoint(x: 21, y: 2))
                knife.addCurve(to: CGPoint(x: 16, y: 7), control1: CGPoint(x: 17, y: 2), control2: CGPoint(x: 16, y: 5))
                knife.addLine(to: CGPoint(x: 16, y: 13))
                knife.addQuadCurve(to: CGPoint(x: 18, y: 15), control: CGPoint(x: 16, y: 15))
                knife.addLine(to: CGPoint(x: 21, y: 15))
                strokePath(knife)
                line(21, 15, 21, 22)
            }
        case .utensilsCrossed:
            var upperKnife = Path()
            upperKnife.move(to: CGPoint(x: 16, y: 2))
            upperKnife.addLine(to: CGPoint(x: 13.7, y: 4.3))
            addSvgArc(
                to: &upperKnife,
                from: CGPoint(x: 13.7, y: 4.3),
                to: CGPoint(x: 13.7, y: 8.5),
                radius: 3,
                largeArc: false,
                sweep: false
            )
            upperKnife.addLine(to: CGPoint(x: 15.5, y: 10.3))
            addSvgArc(
                to: &upperKnife,
                from: CGPoint(x: 15.5, y: 10.3),
                to: CGPoint(x: 19.7, y: 10.3),
                radius: 3,
                largeArc: false,
                sweep: false
            )
            upperKnife.addLine(to: CGPoint(x: 22, y: 8))
            strokePath(upperKnife)

            var fork = Path()
            fork.move(to: CGPoint(x: 15, y: 15))
            fork.addLine(to: CGPoint(x: 3.3, y: 3.3))
            addSvgArc(
                to: &fork,
                from: CGPoint(x: 3.3, y: 3.3),
                to: CGPoint(x: 3.3, y: 9.3),
                radius: 4.2,
                largeArc: false,
                sweep: false
            )
            fork.addLine(to: CGPoint(x: 10.6, y: 16.6))
            fork.addCurve(
                to: CGPoint(x: 13.4, y: 16.6),
                control1: CGPoint(x: 11.3, y: 17.3),
                control2: CGPoint(x: 12.6, y: 17.3)
            )
            fork.addLine(to: CGPoint(x: 15, y: 15))
            fork.closeSubpath()
            strokePath(fork)
            line(15, 15, 22, 22)
            line(2.1, 21.8, 8.5, 15.5)
            line(19, 5, 12, 12)
        case .user:
            var shoulders = Path()
            shoulders.move(to: CGPoint(x: 19, y: 21))
            shoulders.addLine(to: CGPoint(x: 19, y: 19))
            shoulders.addCurve(to: CGPoint(x: 15, y: 15), control1: CGPoint(x: 19, y: 16.8), control2: CGPoint(x: 17.2, y: 15))
            shoulders.addLine(to: CGPoint(x: 9, y: 15))
            shoulders.addCurve(to: CGPoint(x: 5, y: 19), control1: CGPoint(x: 6.8, y: 15), control2: CGPoint(x: 5, y: 16.8))
            shoulders.addLine(to: CGPoint(x: 5, y: 21))
            strokePath(shoulders)
            circle(12, 7, 4)
        case .userLock:
            var shoulders = Path()
            shoulders.move(to: CGPoint(x: 15, y: 21))
            shoulders.addLine(to: CGPoint(x: 15, y: 19))
            shoulders.addCurve(to: CGPoint(x: 11, y: 15), control1: CGPoint(x: 15, y: 16.8), control2: CGPoint(x: 13.2, y: 15))
            shoulders.addLine(to: CGPoint(x: 6, y: 15))
            shoulders.addCurve(to: CGPoint(x: 2, y: 19), control1: CGPoint(x: 3.8, y: 15), control2: CGPoint(x: 2, y: 16.8))
            shoulders.addLine(to: CGPoint(x: 2, y: 21))
            strokePath(shoulders)
            circle(8.5, 7, 4)

            var shackle = Path()
            shackle.move(to: CGPoint(x: 16, y: 12))
            shackle.addLine(to: CGPoint(x: 16, y: 10))
            shackle.addCurve(
                to: CGPoint(x: 20, y: 10),
                control1: CGPoint(x: 16, y: 7.33),
                control2: CGPoint(x: 20, y: 7.33)
            )
            shackle.addLine(to: CGPoint(x: 20, y: 12))
            strokePath(shackle)
            rect(14, 12, 8, 8, 1.5)
            line(18, 15.8, 18.01, 15.8)
        case .userPlus:
            var shoulders = Path()
            shoulders.move(to: CGPoint(x: 16, y: 21))
            shoulders.addLine(to: CGPoint(x: 16, y: 19))
            shoulders.addCurve(to: CGPoint(x: 12, y: 15), control1: CGPoint(x: 16, y: 16.8), control2: CGPoint(x: 14.2, y: 15))
            shoulders.addLine(to: CGPoint(x: 6, y: 15))
            shoulders.addCurve(to: CGPoint(x: 2, y: 19), control1: CGPoint(x: 3.8, y: 15), control2: CGPoint(x: 2, y: 16.8))
            shoulders.addLine(to: CGPoint(x: 2, y: 21))
            strokePath(shoulders)
            circle(9, 7, 4)
            line(19, 8, 19, 14)
            line(16, 11, 22, 11)
        case .waves:
            for y in [7.0, 12.0, 17.0] {
                var path = Path()
                path.move(to: CGPoint(x: 3, y: y))
                path.addCurve(to: CGPoint(x: 9, y: y), control1: CGPoint(x: 5, y: y - 2), control2: CGPoint(x: 7, y: y + 2))
                path.addCurve(to: CGPoint(x: 15, y: y), control1: CGPoint(x: 11, y: y - 2), control2: CGPoint(x: 13, y: y + 2))
                path.addCurve(to: CGPoint(x: 21, y: y), control1: CGPoint(x: 17, y: y - 2), control2: CGPoint(x: 19, y: y + 2))
                strokePath(path)
            }
        case .x:
            line(18, 6, 6, 18)
            line(6, 6, 18, 18)
        case .zap:
            polyline(
                [
                    CGPoint(x: 4, y: 14),
                    CGPoint(x: 13.12, y: 2.17),
                    CGPoint(x: 12.06, y: 8.65),
                    CGPoint(x: 13, y: 10),
                    CGPoint(x: 20, y: 10),
                    CGPoint(x: 10.88, y: 21.83),
                    CGPoint(x: 11.94, y: 15.35),
                    CGPoint(x: 11, y: 14),
                    CGPoint(x: 4, y: 14)
                ],
                closed: true
            )
        case .zapOff:
            polyline([
                CGPoint(x: 10.513, y: 4.856),
                CGPoint(x: 13.12, y: 2.17),
                CGPoint(x: 12.603, y: 6.947)
            ])
            polyline([
                CGPoint(x: 15.656, y: 10),
                CGPoint(x: 20, y: 10),
                CGPoint(x: 19.06, y: 13.403)
            ])
            polyline([
                CGPoint(x: 16.273, y: 16.273),
                CGPoint(x: 10.88, y: 21.83),
                CGPoint(x: 11.94, y: 15.35),
                CGPoint(x: 11, y: 14),
                CGPoint(x: 4, y: 14),
                CGPoint(x: 7.727, y: 7.727)
            ])
            line(2, 2, 22, 22)

        // MARK: - Dish Icons (Lucide Style)
        case .dishNoodle:
            var bowl = Path()
            bowl.move(to: CGPoint(x: 3, y: 12))
            bowl.addCurve(to: CGPoint(x: 12, y: 21), control1: CGPoint(x: 3, y: 17), control2: CGPoint(x: 7, y: 21))
            bowl.addCurve(to: CGPoint(x: 21, y: 12), control1: CGPoint(x: 17, y: 21), control2: CGPoint(x: 21, y: 17))
            strokePath(bowl)
            line(2, 12, 22, 12)
            line(8, 5, 20, 2)
            line(9, 7, 21, 4)
            var noodles = Path()
            noodles.move(to: CGPoint(x: 11, y: 5))
            noodles.addCurve(to: CGPoint(x: 10, y: 12), control1: CGPoint(x: 9, y: 7.5), control2: CGPoint(x: 12, y: 9.5))
            noodles.move(to: CGPoint(x: 14, y: 4.5))
            noodles.addCurve(to: CGPoint(x: 14, y: 12), control1: CGPoint(x: 12.5, y: 7), control2: CGPoint(x: 15.5, y: 9.5))
            strokePath(noodles)

        case .dishDumpling:
            var dumpling = Path()
            dumpling.move(to: CGPoint(x: 3, y: 15))
            dumpling.addCurve(to: CGPoint(x: 21, y: 15), control1: CGPoint(x: 5, y: 21), control2: CGPoint(x: 19, y: 21))
            dumpling.addCurve(to: CGPoint(x: 3, y: 15), control1: CGPoint(x: 19, y: 7), control2: CGPoint(x: 5, y: 7))
            dumpling.closeSubpath()
            strokePath(dumpling)
            line(12, 7, 12, 11)
            line(8, 8.5, 9.5, 12)
            line(16, 8.5, 14.5, 12)

        case .dishSauce:
            var spoon = Path()
            spoon.move(to: CGPoint(x: 6, y: 6))
            spoon.addCurve(to: CGPoint(x: 14, y: 14), control1: CGPoint(x: 15, y: 6), control2: CGPoint(x: 17, y: 11))
            spoon.addCurve(to: CGPoint(x: 6, y: 6), control1: CGPoint(x: 11, y: 17), control2: CGPoint(x: 6, y: 15))
            strokePath(spoon)
            line(13.5, 13.5, 21, 21)
            var drop = Path()
            drop.move(to: CGPoint(x: 7, y: 16))
            drop.addQuadCurve(to: CGPoint(x: 9, y: 20), control: CGPoint(x: 9, y: 17))
            drop.addQuadCurve(to: CGPoint(x: 5, y: 20), control: CGPoint(x: 9, y: 22))
            drop.addQuadCurve(to: CGPoint(x: 7, y: 16), control: CGPoint(x: 5, y: 17))
            strokePath(drop)

        case .dishGrill:
            rect(3, 8, 18, 12, 2)
            line(7.5, 8, 7.5, 20)
            line(12, 8, 12, 20)
            line(16.5, 8, 16.5, 20)
            var smoke = Path()
            smoke.move(to: CGPoint(x: 8, y: 5))
            smoke.addCurve(to: CGPoint(x: 9, y: 2), control1: CGPoint(x: 7, y: 3.5), control2: CGPoint(x: 10, y: 3.5))
            smoke.move(to: CGPoint(x: 14, y: 5))
            smoke.addCurve(to: CGPoint(x: 15, y: 2), control1: CGPoint(x: 13, y: 3.5), control2: CGPoint(x: 16, y: 3.5))
            strokePath(smoke)

        case .dishWok:
            var wok = Path()
            wok.move(to: CGPoint(x: 4, y: 12))
            wok.addCurve(to: CGPoint(x: 18, y: 12), control1: CGPoint(x: 5, y: 21), control2: CGPoint(x: 17, y: 21))
            strokePath(wok)
            line(3, 12, 19, 12)
            line(19, 12, 22, 9)
            var stirMotion = Path()
            stirMotion.move(to: CGPoint(x: 9, y: 8))
            stirMotion.addCurve(to: CGPoint(x: 13, y: 5), control1: CGPoint(x: 9, y: 6), control2: CGPoint(x: 11, y: 5))
            strokePath(stirMotion)
            circle(14.5, 6.5, 0.8)

        case .dishCrispy:
            var drumstick = Path()
            drumstick.move(to: CGPoint(x: 6, y: 8))
            drumstick.addCurve(to: CGPoint(x: 13, y: 15), control1: CGPoint(x: 3, y: 11), control2: CGPoint(x: 6, y: 18))
            drumstick.addLine(to: CGPoint(x: 17, y: 19))
            drumstick.addCurve(to: CGPoint(x: 19, y: 17), control1: CGPoint(x: 18.5, y: 20.5), control2: CGPoint(x: 20.5, y: 18.5))
            drumstick.addLine(to: CGPoint(x: 15, y: 13))
            drumstick.addCurve(to: CGPoint(x: 6, y: 8), control1: CGPoint(x: 18, y: 6), control2: CGPoint(x: 11, y: 3))
            drumstick.closeSubpath()
            strokePath(drumstick)
            line(18, 4, 18, 8)
            line(16, 6, 20, 6)

        case .dishRaw:
            var slice1 = Path()
            slice1.move(to: CGPoint(x: 10, y: 5))
            slice1.addCurve(to: CGPoint(x: 20, y: 15), control1: CGPoint(x: 17, y: 6), control2: CGPoint(x: 21, y: 11))
            slice1.addCurve(to: CGPoint(x: 10, y: 5), control1: CGPoint(x: 15, y: 17), control2: CGPoint(x: 8, y: 11))
            strokePath(slice1)
            var slice2 = Path()
            slice2.move(to: CGPoint(x: 5, y: 10))
            slice2.addCurve(to: CGPoint(x: 15, y: 20), control1: CGPoint(x: 12, y: 11), control2: CGPoint(x: 16, y: 16))
            slice2.addCurve(to: CGPoint(x: 5, y: 10), control1: CGPoint(x: 10, y: 22), control2: CGPoint(x: 3, y: 16))
            strokePath(slice2)
            line(8, 14, 12, 18)

        case .dishFerment:
            var pot = Path()
            pot.move(to: CGPoint(x: 5, y: 9))
            pot.addCurve(to: CGPoint(x: 12, y: 21), control1: CGPoint(x: 3, y: 14), control2: CGPoint(x: 6, y: 21))
            pot.addCurve(to: CGPoint(x: 19, y: 9), control1: CGPoint(x: 18, y: 21), control2: CGPoint(x: 21, y: 14))
            strokePath(pot)
            line(4, 9, 20, 9)
            var lid = Path()
            lid.move(to: CGPoint(x: 6, y: 9))
            lid.addQuadCurve(to: CGPoint(x: 18, y: 9), control: CGPoint(x: 12, y: 5))
            strokePath(lid)
            line(11, 5, 13, 5)

        case .dishCheese:
            var cheese = Path()
            cheese.move(to: CGPoint(x: 4, y: 17))
            cheese.addLine(to: CGPoint(x: 20, y: 7))
            cheese.addLine(to: CGPoint(x: 18, y: 17))
            cheese.closeSubpath()
            strokePath(cheese)
            circle(9, 14.5, 1.5)
            circle(14.5, 12.5, 1.2)

        case .dishSpice:
            var pepper = Path()
            pepper.move(to: CGPoint(x: 15, y: 6))
            pepper.addCurve(to: CGPoint(x: 6, y: 18), control1: CGPoint(x: 10, y: 7), control2: CGPoint(x: 5, y: 12))
            pepper.addCurve(to: CGPoint(x: 17, y: 8), control1: CGPoint(x: 9, y: 18), control2: CGPoint(x: 15, y: 14))
            pepper.closeSubpath()
            strokePath(pepper)
            var stem = Path()
            stem.move(to: CGPoint(x: 16, y: 7))
            stem.addQuadCurve(to: CGPoint(x: 19, y: 3), control: CGPoint(x: 18, y: 5))
            strokePath(stem)

        case .dishCold:
            line(12, 2, 12, 22)
            line(3.34, 7, 20.66, 17)
            line(3.34, 17, 20.66, 7)
            line(10, 5, 12, 3)
            line(14, 5, 12, 3)
            line(10, 19, 12, 21)
            line(14, 19, 12, 21)
            circle(12, 12, 1.5)

        case .dishTofu:
            polyline([CGPoint(x: 12, y: 3), CGPoint(x: 20, y: 7.5), CGPoint(x: 12, y: 12), CGPoint(x: 4, y: 7.5)], closed: true)
            line(4, 7.5, 4, 16.5)
            line(12, 12, 12, 21)
            line(20, 7.5, 20, 16.5)
            line(4, 16.5, 12, 21)
            line(20, 16.5, 12, 21)

        case .dishRice:
            var bowl = Path()
            bowl.move(to: CGPoint(x: 4, y: 11))
            bowl.addCurve(to: CGPoint(x: 12, y: 20), control1: CGPoint(x: 4, y: 16), control2: CGPoint(x: 7, y: 20))
            bowl.addCurve(to: CGPoint(x: 20, y: 11), control1: CGPoint(x: 17, y: 20), control2: CGPoint(x: 20, y: 16))
            strokePath(bowl)
            line(3, 11, 21, 11)
            var rice = Path()
            rice.move(to: CGPoint(x: 6, y: 11))
            rice.addQuadCurve(to: CGPoint(x: 18, y: 11), control: CGPoint(x: 12, y: 5))
            strokePath(rice)
            circle(12, 7.5, 0.8)
        }
    }
}

extension LucideIcon {
    /// 디시 종류(DishKind ID 또는 한글명)에 대응하는 LucideIcon 심볼명을 반환합니다.
    static func dishKindSymbol(for kindId: String) -> String {
        switch kindId {
        case "seafood", "해산물": return "dish.seafood"
        case "meat", "육류": return "dish.meat"
        case "vegetable_herb", "vegetable", "채소": return "dish.vegetable"
        case "legume_tofu", "tofu", "두부": return "dish.tofu"
        case "grain_noodle", "noodle", "면": return "dish.noodle"
        case "dumpling_batter", "dumpling", "만두": return "dish.dumpling"
        case "broth", "soup", "국물", "국·탕": return "dish.broth"
        case "sauce_glaze", "sauce", "소스": return "dish.sauce"
        case "grilled_smoked", "grill", "구이": return "dish.grill"
        case "stir_fried_wok", "wok", "볶음": return "dish.wok"
        case "fried_crispy", "crispy", "튀김": return "dish.crispy"
        case "steamed_braised", "steam", "찜·조림": return "dish.steam"
        case "raw_cured", "raw", "회·생요리": return "dish.raw"
        case "fermented_jang", "ferment", "발효음식": return "dish.ferment"
        case "dairy_cheese", "cheese", "치즈": return "dish.cheese"
        case "spice_heat", "spice", "향신료 음식": return "dish.spice"
        case "cold", "차가운 요리": return "dish.cold"
        case "dessert", "디저트": return "dish.dessert"
        case "beverage_pairing", "beverage", "음료": return "dish.beverage"
        case "rice", "밥": return "dish.rice"
        default: return "circle.dot"
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview("Dish Icons (Lucide Style)") {
        let dishes: [(String, String)] = [
            ("해산물", "dish.seafood"),
            ("육류", "dish.meat"),
            ("채소/허브", "dish.vegetable"),
            ("두부/콩", "dish.tofu"),
            ("면", "dish.noodle"),
            ("만두", "dish.dumpling"),
            ("국물/탕", "dish.broth"),
            ("소스", "dish.sauce"),
            ("구이", "dish.grill"),
            ("볶음/웍", "dish.wok"),
            ("튀김", "dish.crispy"),
            ("찜/조림", "dish.steam"),
            ("회/생요리", "dish.raw"),
            ("발효/장", "dish.ferment"),
            ("치즈", "dish.cheese"),
            ("향신료", "dish.spice"),
            ("차가운 요리", "dish.cold"),
            ("디저트", "dish.dessert"),
            ("음료", "dish.beverage"),
            ("밥", "dish.rice")
        ]

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Lucide Style Dish Icons (20종)")
                    .font(TBFont.bold(18))
                    .foregroundStyle(TBColor.textPrimary)

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 84))], spacing: 12) {
                    ForEach(dishes, id: \.0) { item in
                        VStack(spacing: 8) {
                            LucideIcon(systemName: item.1, size: 24, strokeWidth: 1.8)
                                .foregroundStyle(TBColor.textPrimary)
                            Text(item.0)
                                .font(TBFont.medium(11))
                                .foregroundStyle(TBColor.textSecondary)
                        }
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(TBColor.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay {
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(TBColor.borderSubtle, lineWidth: 1)
                        }
                    }
                }
            }
            .padding()
        }
        .background(TBColor.page)
    }

    #Preview("Lucide Icons") {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 42))], spacing: 14) {
            ForEach(LucideIconName.allCases, id: \.rawValue) { name in
                LucideIcon(name, size: TBIcon.Size.large)
                    .foregroundStyle(TBColor.textPrimary)
            }
        }
        .padding()
        .background(TBColor.page)
    }
#endif

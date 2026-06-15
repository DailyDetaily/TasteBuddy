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
    case circleCheck
    case circleDot
    case circlePlus
    case clock
    case coffee
    case cookingPot
    case croissant
    case cupSoda
    case dessert
    case droplet
    case eggFried
    case ellipsis
    case fish
    case globe
    case heart
    case leaf
    case logOut
    case mail
    case mapPin
    case menu
    case messageCircle
    case minus
    case pencil
    case phone
    case plus
    case search
    case send
    case settings
    case share
    case shieldCheck
    case salad
    case sandwich
    case soup
    case sparkles
    case star
    case store
    case sun
    case trash2
    case trophy
    case utensils
    case user
    case userPlus
    case waves
    case wine
    case x

    init(systemName: String) {
        switch systemName {
        case "archivebox":
            self = .archive
        case "arrow.down.right":
            self = .arrowDownRight
        case "arrow.up.right":
            self = .arrowUpRight
        case "bell":
            self = .bell
        case "bookmark", "bookmark.fill":
            self = .bookmark
        case "calendar.badge.checkmark":
            self = .calendarCheck
        case "camera":
            self = .camera
        case "checkmark":
            self = .check
        case "checkmark.circle", "checkmark.circle.fill":
            self = .circleCheck
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
        case "clock":
            self = .clock
        case "drop.fill":
            self = .droplet
        case "ellipsis":
            self = .ellipsis
        case "globe":
            self = .globe
        case "envelope":
            self = .mail
        case "fork.knife", "fork.knife.circle":
            self = .utensils
        case "gearshape":
            self = .settings
        case "heart", "heart.fill":
            self = .heart
        case "leaf.fill":
            self = .leaf
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
        case "person.badge.plus":
            self = .userPlus
        case "plus":
            self = .plus
        case "plus.circle":
            self = .circlePlus
        case "rectangle.portrait.and.arrow.right":
            self = .logOut
        case "shield.checkered":
            self = .shieldCheck
        case "sparkles":
            self = .sparkles
        case "square.and.arrow.up":
            self = .share
        case "star", "star.fill":
            self = .star
        case "storefront":
            self = .store
        case "sun.max.fill":
            self = .sun
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
        strokeWidth: CGFloat = TBIcon.Stroke.regular
    ) {
        self.init(
            LucideIconName(systemName: systemName),
            size: size,
            strokeWidth: strokeWidth,
            filled: systemName.hasSuffix(".fill")
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
            line(7, 7, 17, 17)
            polyline([CGPoint(x: 17, y: 7), CGPoint(x: 17, y: 17), CGPoint(x: 7, y: 17)])
        case .arrowUpRight:
            polyline([CGPoint(x: 7, y: 7), CGPoint(x: 17, y: 7), CGPoint(x: 17, y: 17)])
            line(7, 17, 17, 7)
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
            line(8, 2, 8, 6)
            line(16, 2, 16, 6)
            rect(3, 4, 18, 18, 2)
            line(3, 10, 21, 10)
            polyline([CGPoint(x: 9, y: 16), CGPoint(x: 11, y: 18), CGPoint(x: 15, y: 14)])
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
            circle(12, 12, 10)
            polyline([CGPoint(x: 9, y: 12), CGPoint(x: 11, y: 14), CGPoint(x: 15, y: 10)])
        case .circleDot:
            circle(12, 12, 10)
            circle(12, 12, 2)
        case .circlePlus:
            circle(12, 12, 10)
            line(8, 12, 16, 12)
            line(12, 8, 12, 16)
        case .clock:
            circle(12, 12, 10)
            polyline([CGPoint(x: 12, y: 6), CGPoint(x: 12, y: 12), CGPoint(x: 16, y: 14)])
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
        case .globe:
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
        case .leaf:
            var path = Path()
            path.move(to: CGPoint(x: 11, y: 20))
            path.addCurve(to: CGPoint(x: 20, y: 4), control1: CGPoint(x: 16, y: 20), control2: CGPoint(x: 22, y: 12))
            path.addCurve(to: CGPoint(x: 4, y: 13), control1: CGPoint(x: 11, y: 2), control2: CGPoint(x: 4, y: 6))
            path.addCurve(to: CGPoint(x: 11, y: 20), control1: CGPoint(x: 4, y: 17), control2: CGPoint(x: 7, y: 20))
            strokePath(path)
            line(4, 20, 14, 10)
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
                to: CGPoint(x: 20, y: 10),
                control1: CGPoint(x: 4, y: 5.6),
                control2: CGPoint(x: 7.6, y: 2)
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
            circle(12, 12, 3)
            for angle in stride(from: 0.0, to: Double.pi * 2, by: Double.pi / 4) {
                let inner = CGPoint(x: 12 + CGFloat(cos(angle)) * 6.6, y: 12 + CGFloat(sin(angle)) * 6.6)
                let outer = CGPoint(x: 12 + CGFloat(cos(angle)) * 9.6, y: 12 + CGFloat(sin(angle)) * 9.6)
                line(inner.x, inner.y, outer.x, outer.y)
            }
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
            line(20, 3, 20, 7)
            line(22, 5, 18, 5)
            line(4, 17, 4, 19)
            line(5, 18, 3, 18)
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
        }
    }
}

#if canImport(PreviewsMacros)
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
